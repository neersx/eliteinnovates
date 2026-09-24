#!/usr/bin/env bash
# Redeploy an already configured Elite Innovates Angular SSR site.
# Usage: NODE_BINARY=/opt/node-v26.9.0/bin/node bash deployments/redeploy-script.sh [branch]
# Set RELOAD_NGINX=1 only after changing the installed nginx configuration.
set -Eeuo pipefail

BRANCH="${1:-master}"
REPO_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_DIR=/var/www/elite-innovates
WEB_DIR="$BASE_DIR/web"
SERVICE=elite-innovates.service
NODE_BINARY="${NODE_BINARY:-}"
STAGE_DIR=""
BACKUP_DIR=""
HEALTH_FILE=""
SERVICE_STOPPED=false
SWAPPED=false
COMPLETED=false

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
as_root() { if (( EUID == 0 )); then "$@"; else sudo "$@"; fi; }

on_exit() {
    local status="$?"
    trap - EXIT
    if (( status != 0 )) && $SWAPPED && ! $COMPLETED; then
        printf 'Redeploy failed. Restoring the previous web directory...\n' >&2
        as_root systemctl stop "$SERVICE" || true
        if as_root test -d "$WEB_DIR"; then
            as_root mv "$WEB_DIR" "$BACKUP_DIR/failed-web" || true
        fi
        if as_root mv "$BACKUP_DIR/web" "$WEB_DIR"; then
            as_root systemctl start "$SERVICE" || true
        else
            printf 'Rollback needs attention: %s\n' "$BACKUP_DIR" >&2
        fi
    elif (( status != 0 )) && $SERVICE_STOPPED; then
        as_root systemctl start "$SERVICE" || true
    fi
    if [[ -n "$STAGE_DIR" ]] && as_root test -d "$STAGE_DIR"; then
        as_root rm -rf -- "$STAGE_DIR"
    fi
    if [[ -n "$HEALTH_FILE" ]]; then rm -f -- "$HEALTH_FILE"; fi
    exit "$status"
}
trap on_exit EXIT

[[ $# -le 1 ]] || die 'Usage: redeploy-script.sh [branch]'
[[ "$(uname -s)" == Linux ]] || die 'Run this script on the Ubuntu server.'
[[ "${RELOAD_NGINX:-0}" == 0 || "${RELOAD_NGINX:-0}" == 1 ]] || die 'RELOAD_NGINX must be 0 or 1.'
[[ -d "$REPO_DIR/.git" || -f "$REPO_DIR/.git" ]] || die "Not a Git checkout: $REPO_DIR"
git -C "$REPO_DIR" check-ref-format "refs/heads/$BRANCH" >/dev/null || die 'Invalid branch name.'
[[ "$(git -C "$REPO_DIR" branch --show-current)" == "$BRANCH" ]] || die "Check out $BRANCH before redeploying."
git -C "$REPO_DIR" diff --quiet && git -C "$REPO_DIR" diff --cached --quiet || die 'Commit or stash tracked changes before rebasing.'

if [[ -z "$NODE_BINARY" ]]; then
    if [[ -x /opt/node-v26.9.0/bin/node ]]; then
        NODE_BINARY=/opt/node-v26.9.0/bin/node
    else
        NODE_BINARY="$(command -v node || true)"
    fi
fi
[[ "$NODE_BINARY" == /* && -x "$NODE_BINARY" ]] || die 'Set NODE_BINARY to an executable absolute Node.js 26 path.'
NODE_VERSION="$("$NODE_BINARY" --version)"
NODE_MAJOR="${NODE_VERSION#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
[[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] || die "Cannot read Node version: $NODE_VERSION"
(( NODE_MAJOR >= 26 )) || die "Node.js 26 or newer is required; found $NODE_VERSION."
export PATH="$(dirname -- "$NODE_BINARY"):/usr/bin:/bin:$PATH"
for required in git npm rsync systemctl curl flock mktemp; do
    command -v "$required" >/dev/null || die "Required command missing: $required"
done
if (( EUID != 0 )); then sudo -v; fi
as_root test -d "$WEB_DIR" || die "Existing deployment missing: $WEB_DIR. Use deploy-script.sh for first setup."
as_root systemctl is-active --quiet "$SERVICE" || die "$SERVICE is not running. Use deploy-script.sh for first setup or repair."
SERVICE_WORKDIR="$(as_root systemctl show --property=WorkingDirectory --value "$SERVICE")"
SERVICE_EXEC="$(as_root systemctl show --property=ExecStart --value "$SERVICE")"
[[ "$SERVICE_WORKDIR" == "$WEB_DIR" ]] || die "The installed service does not use $WEB_DIR. Use deploy-script.sh to update it."
[[ "$SERVICE_EXEC" == *"$NODE_BINARY $WEB_DIR/server/server.mjs"* ]] || die 'The installed service uses a different Node binary or server path. Use deploy-script.sh to update it.'

# Share the lock with deploy-script.sh so the two scripts cannot deploy together.
as_root touch "$BASE_DIR/.deploy.lock"
as_root chown "$(id -u):$(id -g)" "$BASE_DIR/.deploy.lock"
exec 9>"$BASE_DIR/.deploy.lock"
flock -n 9 || die 'Another Elite Innovates deployment is running.'

printf 'Fetching and rebasing %s...\n' "$BRANCH"
git -C "$REPO_DIR" fetch origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
git -C "$REPO_DIR" rebase "origin/$BRANCH"

printf 'Installing dependencies and building Angular SSR...\n'
(cd "$REPO_DIR" && npm ci --include=dev && npm run build -- --configuration production)
DIST_DIR="$REPO_DIR/dist/eliteinnovates"
[[ -s "$DIST_DIR/server/server.mjs" && -d "$DIST_DIR/browser" ]] || die 'SSR build output is missing browser/ or server/server.mjs.'

# Stage the entire build before stopping the running service.
STAGE_DIR="$(as_root mktemp -d "$BASE_DIR/.web-next.XXXXXX")"
as_root rsync -a "$DIST_DIR/" "$STAGE_DIR/"
as_root chown -R root:www-data "$STAGE_DIR"
as_root find "$STAGE_DIR" -type d -exec chmod 755 {} +
as_root find "$STAGE_DIR" -type f -exec chmod 644 {} +
BACKUP_DIR="$BASE_DIR/backup/redeploy-$(date -u +%Y%m%dT%H%M%SZ)-$$"
as_root mkdir -p "$BACKUP_DIR"

printf 'Stopping %s and activating the new build...\n' "$SERVICE"
as_root systemctl stop "$SERVICE"
SERVICE_STOPPED=true
as_root mv "$WEB_DIR" "$BACKUP_DIR/web"
SWAPPED=true
as_root mv "$STAGE_DIR" "$WEB_DIR"
STAGE_DIR=""
as_root systemctl start "$SERVICE"

HEALTH_FILE="$(mktemp)"
ready=false
for (( attempt=1; attempt<=15; attempt++ )); do
    if curl --noproxy '*' --fail --silent --max-time 10 \
        -H 'Host: eliteinnovates.com' \
        -H 'X-Forwarded-Host: eliteinnovates.com' \
        -H 'X-Forwarded-Proto: https' \
        -H 'X-Forwarded-For: 127.0.0.1' \
        http://127.0.0.1:4300/ -o "$HEALTH_FILE" &&
        grep -Fq '<app-home' "$HEALTH_FILE"; then
        ready=true
        break
    fi
    sleep 2
done
$ready || die 'The redeployed SSR service did not render the homepage.'
as_root systemctl is-active --quiet "$SERVICE" || die "$SERVICE exited after startup."

# Nginx serves static files from the same path; a code-only deploy needs no reload.
if [[ "${RELOAD_NGINX:-0}" == 1 ]]; then
    as_root nginx -t
    as_root systemctl reload nginx
fi

COMPLETED=true
printf 'Redeployed %s to %s. Previous build: %s/web\n' \
    "$(git -C "$REPO_DIR" rev-parse --short HEAD)" "$WEB_DIR" "$BACKUP_DIR"
