#!/usr/bin/env bash
# Deploy this Angular SSR application to the shared Linux VPS.
# Usage: bash deployments/deploy-script.sh [branch]
# Default branch matches this repository: master.
# Builds an isolated snapshot of origin/<branch>; never resets local changes.
# See README.md for Node, TLS, paths and the first-deployment prerequisites.
set -Eeuo pipefail

BRANCH_NAME="${1:-master}"
REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_DIR="/var/www/elite-innovates"
WEB_DEPLOY_DIR="$BASE_DIR/web"
BACKUP_ROOT="$BASE_DIR/backup"
SHA_FILE="$BASE_DIR/.deployed-sha"
SERVICE="elite-innovates.service"
UNIT_FILE="/etc/systemd/system/$SERVICE"
NGINX_FILE="/etc/nginx/conf.d/eliteinnovates.com.conf"
DOMAIN="eliteinnovates.com"
SSR_PORT=4300
NODE_BINARY="${NODE_BINARY:-}"
SSL_DIR="$BASE_DIR/ssl"
CERT_FILE="$SSL_DIR/eliteinnovates_com.fullchain.pem"
LEAF_FILE="$SSL_DIR/eliteinnovates_com.crt"
BUNDLE_FILE="$SSL_DIR/eliteinnovates_com.ca-bundle"
KEY_FILE="$SSL_DIR/eliteinnovates_com.key"
BUILD_DIR=""
BACKUP_DIR=""
CONFIG_CHANGED=false
APP_CHANGED=false
NGINX_RELOAD_ATTEMPTED=false
WAS_ACTIVE=false
WAS_ENABLED=false
HAD_WEB=false
HAD_UNIT=false
HAD_NGINX=false
HAD_CERT=false
HAD_LEAF=false
HAD_BUNDLE=false
COMPLETED=false
ENABLE_ATTEMPTED=false
SHA_CHANGED=false

log() { printf '\n%s\n' "$*"; }
die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
as_root() { if (( EUID == 0 )); then "$@"; else sudo "$@"; fi; }

# Restore just this application's files and service on a failed activation.
# Never stop nginx or kill other Node processes on the shared server.
on_exit() {
    local code="$1" restored=true
    trap - EXIT INT TERM
    if (( code != 0 )) && ! $COMPLETED && { $APP_CHANGED || $CONFIG_CHANGED; }; then
        set +e
        log "Deployment failed. Restoring the previous Elite Innovates deployment..."
        as_root journalctl -u "$SERVICE" -n 40 --no-pager || true
        if $APP_CHANGED; then
            as_root systemctl stop "$SERVICE" || restored=false
            if $HAD_WEB; then
                as_root rsync -a --checksum --delete "$BACKUP_DIR/web/" "$WEB_DEPLOY_DIR/" || restored=false
            else
                as_root rm -rf -- "$WEB_DEPLOY_DIR" || restored=false
            fi
        fi
        if $ENABLE_ATTEMPTED && ! $WAS_ENABLED; then
            as_root systemctl disable "$SERVICE" || restored=false
        fi
        if $SHA_CHANGED; then
            if as_root test -f "$BACKUP_DIR/deployed-sha"; then
                as_root cp -p "$BACKUP_DIR/deployed-sha" "$SHA_FILE" || restored=false
            else
                as_root rm -f -- "$SHA_FILE" || restored=false
            fi
        fi
        if $CONFIG_CHANGED; then
            if $HAD_CERT; then
                as_root cp -p "$BACKUP_DIR/eliteinnovates_com.fullchain.pem" "$CERT_FILE" || restored=false
            else
                as_root rm -f -- "$CERT_FILE" || restored=false
            fi
            if $HAD_LEAF; then
                as_root cp -p "$BACKUP_DIR/eliteinnovates_com.crt" "$LEAF_FILE" || restored=false
            else
                as_root rm -f -- "$LEAF_FILE" || restored=false
            fi
            if $HAD_BUNDLE; then
                as_root cp -p "$BACKUP_DIR/eliteinnovates_com.ca-bundle" "$BUNDLE_FILE" || restored=false
            else
                as_root rm -f -- "$BUNDLE_FILE" || restored=false
            fi
            if $HAD_UNIT; then
                as_root cp -p "$BACKUP_DIR/service" "$UNIT_FILE" || restored=false
            else
                as_root rm -f -- "$UNIT_FILE" || restored=false
            fi
            if $HAD_NGINX; then
                as_root cp -p "$BACKUP_DIR/nginx.conf" "$NGINX_FILE" || restored=false
            else
                as_root rm -f -- "$NGINX_FILE" || restored=false
            fi
            as_root systemctl daemon-reload || restored=false
        fi
        if $APP_CHANGED && $WAS_ACTIVE; then
            as_root systemctl reset-failed "$SERVICE" || true
            as_root systemctl start "$SERVICE" || restored=false
        fi
        if $NGINX_RELOAD_ATTEMPTED; then
            as_root nginx -t && as_root systemctl reload nginx || restored=false
        fi
        if $restored; then
            log "Previous deployment restored. Failed deployment was not recorded."
        else
            log "Rollback needs attention. Backup: $BACKUP_DIR"
        fi
    fi
    if [[ -n "$BUILD_DIR" ]]; then rm -rf -- "$BUILD_DIR"; fi
    exit "$code"
}
trap 'on_exit $?' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

[[ $# -le 1 ]] || die 'Usage: deploy-script.sh [branch]'
[[ "$(uname -s)" == Linux ]] || die 'Run this script on the Linux VPS.'
# The systemd unit uses this Node binary, so build with the same installation.
export PATH="/usr/bin:/bin:$PATH"
NODE_VERSION=""
FOUND_NODE_VERSION=""
if [[ -n "$NODE_BINARY" ]]; then
    [[ "$NODE_BINARY" == /* ]] || die 'NODE_BINARY must be an absolute path; set NODE_BINARY=/absolute/path/to/node26.'
    [[ -x "$NODE_BINARY" ]] || die "Node.js is not executable at $NODE_BINARY."
    NODE_VERSION="$("$NODE_BINARY" --version 2>/dev/null || true)"
    NODE_MAJOR="${NODE_VERSION#v}"
    NODE_MAJOR="${NODE_MAJOR%%.*}"
    [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] || die "Could not read the Node version from $NODE_BINARY."
    (( NODE_MAJOR >= 26 )) || die "Found Node.js $NODE_VERSION at $NODE_BINARY; this project requires Node.js 26 or newer. Install Node.js 26, or set NODE_BINARY=/absolute/path/to/node26."
else
    NODE_FROM_PATH="$(type -P node || true)"
    for candidate in "$NODE_FROM_PATH" /usr/local/bin/node /usr/bin/node /usr/bin/nodejs /usr/local/bin/node26 /usr/bin/node26 /opt/node26/bin/node; do
        [[ -n "$candidate" && -x "$candidate" ]] || continue
        candidate_version="$("$candidate" --version 2>/dev/null || true)"
        candidate_major="${candidate_version#v}"
        candidate_major="${candidate_major%%.*}"
        [[ "$candidate_major" =~ ^[0-9]+$ ]] || continue
        if (( candidate_major >= 26 )); then
            NODE_BINARY="$candidate"
            NODE_VERSION="$candidate_version"
            break
        fi
        if [[ -z "$FOUND_NODE_VERSION" ]]; then
            FOUND_NODE_VERSION="$candidate_version at $candidate"
        fi
    done
    if [[ -z "$NODE_BINARY" ]]; then
        if [[ -n "$FOUND_NODE_VERSION" ]]; then
            die "Found Node.js $FOUND_NODE_VERSION; this project requires Node.js 26 or newer. Install Node.js 26, add it to PATH, or set NODE_BINARY=/absolute/path/to/node26."
        fi
        die 'Node.js was not found on PATH or in common Ubuntu install locations. Install Node.js 26 or set NODE_BINARY=/absolute/path/to/node26.'
    fi
fi
# Keep npm lifecycle scripts and `#!/usr/bin/env node` on this same runtime.
export PATH="$(dirname -- "$NODE_BINARY"):/usr/bin:/bin:$PATH"
for command in git npm rsync tar curl ss systemctl nginx flock grep mktemp runuser openssl; do
    command -v "$command" >/dev/null || die "Required command not found: $command"
done
if (( EUID != 0 )); then sudo -v; fi
as_root test -s "$KEY_FILE" || die "TLS private key missing: $KEY_FILE. Keep the key on the VPS only."
as_root systemctl is-active --quiet nginx || die 'nginx must already be running on this shared VPS.'
[[ -d "$REPO_DIR/.git" || -f "$REPO_DIR/.git" ]] || die "Not a Git checkout: $REPO_DIR"
git -C "$REPO_DIR" check-ref-format "refs/heads/$BRANCH_NAME" >/dev/null || die 'Invalid branch name.'

as_root mkdir -p "$BASE_DIR" "$BACKUP_ROOT"
as_root touch "$BASE_DIR/.deploy.lock"
as_root chown "$(id -u):$(id -g)" "$BASE_DIR/.deploy.lock"
exec 9>"$BASE_DIR/.deploy.lock"
flock -n 9 || die 'Another Elite Innovates deployment is already running.'

as_root systemctl is-active --quiet "$SERVICE" && WAS_ACTIVE=true
as_root systemctl is-enabled --quiet "$SERVICE" && WAS_ENABLED=true
listeners="$(as_root ss -ltnH "sport = :$SSR_PORT")"
if [[ -n "$listeners" ]] && ! $WAS_ACTIVE; then
    as_root ss -ltnp "sport = :$SSR_PORT"
    die "Port $SSR_PORT is in use while $SERVICE is inactive. No processes were stopped."
fi

log "Fetching origin/$BRANCH_NAME..."
git -C "$REPO_DIR" fetch origin "+refs/heads/$BRANCH_NAME:refs/remotes/origin/$BRANCH_NAME"
NEW_SHA="$(git -C "$REPO_DIR" rev-parse "refs/remotes/origin/$BRANCH_NAME^{commit}")"
BUILD_DIR="$(mktemp -d /tmp/elite-innovates-build.XXXXXX)"
git -C "$REPO_DIR" archive "$NEW_SHA" | tar -x -C "$BUILD_DIR"
SERVICE_SOURCE="$BUILD_DIR/deployments/$SERVICE"
SERVICE_RENDERED="$BUILD_DIR/$SERVICE"
NGINX_SOURCE="$BUILD_DIR/deployments/nginx.conf"
LEAF_SOURCE="$BUILD_DIR/deployments/certs/eliteinnovates_com.crt"
BUNDLE_SOURCE="$BUILD_DIR/deployments/certs/eliteinnovates_com.ca-bundle"
[[ -s "$SERVICE_SOURCE" && -s "$NGINX_SOURCE" ]] || die 'Commit and push the deployment files to the selected branch first.'
[[ -s "$LEAF_SOURCE" && -s "$BUNDLE_SOURCE" ]] || die 'Commit and push the public TLS certificate and CA bundle to the selected branch first.'
grep -Fxq "Environment=PORT=$SSR_PORT" "$SERVICE_SOURCE" || die 'Service port does not match the script.'
grep -Fxq "Environment=HOST=127.0.0.1" "$SERVICE_SOURCE" || die 'Service must bind to loopback.'
grep -Eq '^ExecStart=/[^ ]*/node ' "$SERVICE_SOURCE" || die 'Service ExecStart must point to an absolute Node binary path.'
as_root runuser -u www-data -- "$NODE_BINARY" --version >/dev/null || die "www-data cannot execute $NODE_BINARY. Install Node.js 26 somewhere accessible to the service user, such as /usr/bin/node."
grep -Fxq "WorkingDirectory=$WEB_DEPLOY_DIR" "$SERVICE_SOURCE" || die 'Service deployment path does not match the script.'
sed -E "s|^ExecStart=/[^ ]*/node |ExecStart=$NODE_BINARY |" "$SERVICE_SOURCE" > "$SERVICE_RENDERED"
grep -Fq "server 127.0.0.1:$SSR_PORT;" "$NGINX_SOURCE" || die 'nginx upstream does not match the script.'
grep -Fq "root $WEB_DEPLOY_DIR/browser;" "$NGINX_SOURCE" || die 'nginx asset directory does not match the script.'
grep -Fq "ssl_certificate     $CERT_FILE;" "$NGINX_SOURCE" || die 'nginx certificate path does not match the script.'
grep -Fq "ssl_certificate_key $KEY_FILE;" "$NGINX_SOURCE" || die 'nginx private key path does not match the script.'
openssl x509 -in "$LEAF_SOURCE" -checkend 0 -noout || die 'The repository TLS certificate has expired.'
for hostname in "$DOMAIN" "www.$DOMAIN"; do
    openssl verify -purpose sslserver -verify_hostname "$hostname" -untrusted "$BUNDLE_SOURCE" "$LEAF_SOURCE" || die "The repository TLS certificate chain is invalid or does not cover $hostname."
done
CERT_PUBLIC_KEY="$(openssl x509 -in "$LEAF_SOURCE" -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256)"
KEY_PUBLIC_KEY="$(as_root openssl pkey -in "$KEY_FILE" -pubout -outform DER | openssl dgst -sha256)"
[[ "$CERT_PUBLIC_KEY" == "$KEY_PUBLIC_KEY" ]] || die 'The repository TLS certificate does not match the installed private key.'
{ cat "$LEAF_SOURCE"; printf '\n'; cat "$BUNDLE_SOURCE"; } > "$BUILD_DIR/eliteinnovates_com.fullchain.pem"

log "Building Angular SSR ($NEW_SHA), with the current site still running..."
(cd "$BUILD_DIR" && npm ci --include=dev && npm run build -- --configuration production)
DIST_DIR="$BUILD_DIR/dist/eliteinnovates"
[[ -s "$DIST_DIR/server/server.mjs" && -d "$DIST_DIR/browser" ]] || die 'Expected browser/ and server/server.mjs build outputs are missing.'

BACKUP_DIR="$BACKUP_ROOT/$(date -u +%Y%m%dT%H%M%SZ)-${NEW_SHA:0:12}-$$"
as_root mkdir -p "$BACKUP_DIR"
if as_root test -d "$WEB_DEPLOY_DIR"; then
    HAD_WEB=true
    as_root mkdir -p "$BACKUP_DIR/web"
    as_root rsync -a "$WEB_DEPLOY_DIR/" "$BACKUP_DIR/web/"
fi
if as_root test -e "$UNIT_FILE"; then HAD_UNIT=true; as_root cp -p "$UNIT_FILE" "$BACKUP_DIR/service"; fi
if as_root test -e "$NGINX_FILE"; then HAD_NGINX=true; as_root cp -p "$NGINX_FILE" "$BACKUP_DIR/nginx.conf"; fi
if as_root test -e "$CERT_FILE"; then HAD_CERT=true; as_root cp -p "$CERT_FILE" "$BACKUP_DIR/eliteinnovates_com.fullchain.pem"; fi
if as_root test -e "$LEAF_FILE"; then HAD_LEAF=true; as_root cp -p "$LEAF_FILE" "$BACKUP_DIR/eliteinnovates_com.crt"; fi
if as_root test -e "$BUNDLE_FILE"; then HAD_BUNDLE=true; as_root cp -p "$BUNDLE_FILE" "$BACKUP_DIR/eliteinnovates_com.ca-bundle"; fi
if as_root test -f "$SHA_FILE"; then as_root cp -p "$SHA_FILE" "$BACKUP_DIR/deployed-sha"; fi

# Validate the new vhost against the full shared nginx configuration before
# stopping Node. Editing the file does not affect active nginx workers yet.
CONFIG_CHANGED=true
as_root install -d -m 755 "$SSL_DIR"
as_root install -m 644 "$LEAF_SOURCE" "$LEAF_FILE"
as_root install -m 644 "$BUNDLE_SOURCE" "$BUNDLE_FILE"
as_root install -m 644 "$BUILD_DIR/eliteinnovates_com.fullchain.pem" "$CERT_FILE"
as_root install -m 644 "$NGINX_SOURCE" "$NGINX_FILE"
as_root nginx -t

log 'Activating the new Elite Innovates build...'
APP_CHANGED=true
if $WAS_ACTIVE; then as_root systemctl stop "$SERVICE"; fi
listeners="$(as_root ss -ltnH "sport = :$SSR_PORT")"
if [[ -n "$listeners" ]]; then
    as_root ss -ltnp "sport = :$SSR_PORT"
    die "Port $SSR_PORT is still occupied. Refusing to kill a process on the shared VPS."
fi
as_root mkdir -p "$WEB_DEPLOY_DIR"
as_root rsync -a --checksum --delete "$DIST_DIR/" "$WEB_DEPLOY_DIR/"
as_root chown -R root:www-data "$WEB_DEPLOY_DIR"
as_root find "$WEB_DEPLOY_DIR" -type d -exec chmod 755 {} +
as_root find "$WEB_DEPLOY_DIR" -type f -exec chmod 644 {} +
as_root install -m 644 "$SERVICE_RENDERED" "$UNIT_FILE"
as_root systemctl daemon-reload
as_root systemctl reset-failed "$SERVICE" || true
as_root systemctl start "$SERVICE"

# The stock index has og:title even in CSR mode. Require an actual page
# component to prove that a rendered page (SSR/prerender) was returned.
rendered_page() {
    local route="$1" marker="$2" destination="$3"
    curl --noproxy '*' --fail --silent --show-error --max-time 15 \
        -H "Host: $DOMAIN" -H "X-Forwarded-Host: $DOMAIN" \
        -H 'X-Forwarded-Proto: https' -H 'X-Forwarded-For: 127.0.0.1' \
        "http://127.0.0.1:$SSR_PORT$route" -o "$destination" && grep -Fq "$marker" "$destination"
}
ready=false
for (( attempt=1; attempt<=15; attempt++ )); do
    if rendered_page / '<app-home' "$BUILD_DIR/home-response.html"; then ready=true; break; fi
    sleep 2
done
$ready || die 'Node did not return rendered homepage content.'
rendered_page /services '<app-services-page' "$BUILD_DIR/services-response.html" || die 'Services page check failed.'
rendered_page /portfolio '<app-portfolio-page' "$BUILD_DIR/portfolio-response.html" || die 'Portfolio page check failed.'
as_root systemctl is-active --quiet "$SERVICE" || die 'The SSR service exited during health checks.'

log 'Reloading nginx and checking HTTPS through the local reverse proxy...'
NGINX_RELOAD_ATTEMPTED=true
as_root nginx -t
as_root systemctl reload nginx
# --resolve tests this VPS and its certificate, without depending on DNS propagation.
curl --noproxy '*' --fail --silent --show-error --max-time 20 \
    --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/" -o "$BUILD_DIR/https-response.html"
grep -Fq '<app-home' "$BUILD_DIR/https-response.html" || die 'nginx did not return a rendered homepage over HTTPS.'
# Record a successful deployment only after all checks pass.
if ! $WAS_ENABLED; then ENABLE_ATTEMPTED=true; as_root systemctl enable "$SERVICE"; fi
printf '%s\n' "$NEW_SHA" > "$BUILD_DIR/deployed-sha"
as_root install -m 644 "$BUILD_DIR/deployed-sha" "$SHA_FILE.new"
SHA_CHANGED=true
as_root mv -f "$SHA_FILE.new" "$SHA_FILE"
COMPLETED=true
log "Deployment complete: https://$DOMAIN ($NEW_SHA)"
log "Previous files are backed up in $BACKUP_DIR"
as_root systemctl status "$SERVICE" --no-pager || true
