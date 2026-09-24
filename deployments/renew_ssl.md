# Elite Innovates SSL certificate renewal runbook

Use this runbook on the Ubuntu server to validate and install a renewed certificate for `eliteinnovates.com` and `www.eliteinnovates.com`. The two nginx HTTPS server blocks use the same certificate and key. Certificate renewal does not require restarting the Angular SSR service.

## Certificate locations

| Item | Path |
| --- | --- |
| Renewed leaf certificate | `/var/www/elite-innovates/eliteinnovates/deployments/certs/eliteinnovates_com.crt` |
| Renewed CA bundle | `/var/www/elite-innovates/eliteinnovates/deployments/certs/eliteinnovates_com.ca-bundle` |
| Installed leaf certificate | `/var/www/elite-innovates/ssl/eliteinnovates_com.crt` |
| Installed CA bundle | `/var/www/elite-innovates/ssl/eliteinnovates_com.ca-bundle` |
| Installed full chain | `/var/www/elite-innovates/ssl/eliteinnovates_com.fullchain.pem` |
| Installed private key | `/var/www/elite-innovates/ssl/eliteinnovates_com.key` |
| nginx configuration | `/etc/nginx/conf.d/eliteinnovates.com.conf` |
| Protected backups | `/var/www/elite-innovates/ssl-backups/<timestamp>/` |

The certificate currently supplied in the repository expires **April 9, 2027 at 17:27:17 UTC**. Check the renewed certificate's actual expiry during each renewal. The private key is not in Git. Obtain the matching key from the certificate request or your certificate provider if it is not already installed on the server. An unrelated new key will not work with the certificate.

## 1. Prepare and inspect the renewed files

Run these commands on the server as a user with `sudo` access. Upload the renewed leaf certificate and CA bundle to the paths above. Keep a new private key in a protected server location outside Git; when renewing with the existing key, use the installed key.

```bash
set -euo pipefail
REPO_DIR=/var/www/elite-innovates/eliteinnovates
CERT_SOURCE="$REPO_DIR/deployments/certs"
SSL_DIR=/var/www/elite-innovates/ssl
LEAF="$CERT_SOURCE/eliteinnovates_com.crt"
BUNDLE="$CERT_SOURCE/eliteinnovates_com.ca-bundle"

# For a renewal using the existing private key:
KEY_SOURCE="$SSL_DIR/eliteinnovates_com.key"
# For a renewal with a new key, set KEY_SOURCE to its real server path instead.

test -s "$LEAF"
test -s "$BUNDLE"
sudo test -s "$KEY_SOURCE"
openssl x509 -in "$LEAF" -noout -subject -issuer -dates
openssl x509 -in "$LEAF" -noout -text | grep -A 2 'Subject Alternative Name'
openssl x509 -in "$LEAF" -checkend 0 -noout
```

Confirm that the subject alternative names include **both** `eliteinnovates.com` and `www.eliteinnovates.com`, and that `notAfter` is the expected renewed date. Stop if the certificate is expired or either name is missing.

## 2. Verify the key and CA chain

Compare public keys without printing or copying the private key:

```bash
CERT_PUBLIC_KEY="$(openssl x509 -in "$LEAF" -pubkey -noout |
  openssl pkey -pubin -outform DER | openssl sha256)"
KEY_PUBLIC_KEY="$(sudo openssl pkey -in "$KEY_SOURCE" -pubout -outform DER |
  openssl sha256)"
test "$CERT_PUBLIC_KEY" = "$KEY_PUBLIC_KEY"
echo 'Certificate and private key match.'

openssl verify -purpose sslserver -untrusted "$BUNDLE" "$LEAF"
```

The final command should report `eliteinnovates_com.crt: OK`. Resolve a mismatch or verification failure before installing anything.

## 3. Assemble the full chain and back up the installed files

The full chain contains the leaf certificate first, followed by the CA bundle. The current bundle contains two certificates; inspect a renewed bundle rather than assuming that count will stay the same.

```bash
TEMP_CHAIN="$(mktemp)"
trap 'rm -f "$TEMP_CHAIN"' EXIT
{ cat "$LEAF"; printf '\n'; cat "$BUNDLE"; } > "$TEMP_CHAIN"
grep -c 'BEGIN CERTIFICATE' "$TEMP_CHAIN"

BACKUP_TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="/var/www/elite-innovates/ssl-backups/$BACKUP_TIMESTAMP"
sudo install -d -o root -g root -m 0700 "$BACKUP_DIR"
sudo install -d -o root -g root -m 0755 "$SSL_DIR"

if sudo test -f "$SSL_DIR/eliteinnovates_com.fullchain.pem"; then
  sudo cp -p "$SSL_DIR/eliteinnovates_com.fullchain.pem" "$BACKUP_DIR/"
fi
if sudo test -f "$SSL_DIR/eliteinnovates_com.crt"; then
  sudo cp -p "$SSL_DIR/eliteinnovates_com.crt" "$BACKUP_DIR/"
fi
if sudo test -f "$SSL_DIR/eliteinnovates_com.ca-bundle"; then
  sudo cp -p "$SSL_DIR/eliteinnovates_com.ca-bundle" "$BACKUP_DIR/"
fi
if sudo test -f "$SSL_DIR/eliteinnovates_com.key"; then
  sudo cp -p "$SSL_DIR/eliteinnovates_com.key" "$BACKUP_DIR/"
fi
echo "Backup: $BACKUP_DIR"
```

Record the printed backup directory for rollback. If this is the first installation, the corresponding backup files will not exist.

## 4. Install and reload nginx

```bash
sudo install -o root -g root -m 0644 "$LEAF" \
  "$SSL_DIR/eliteinnovates_com.crt"
sudo install -o root -g root -m 0644 "$BUNDLE" \
  "$SSL_DIR/eliteinnovates_com.ca-bundle"
sudo install -o root -g root -m 0644 "$TEMP_CHAIN" \
  "$SSL_DIR/eliteinnovates_com.fullchain.pem"
if [ "$KEY_SOURCE" != "$SSL_DIR/eliteinnovates_com.key" ]; then
  sudo install -o root -g root -m 0600 "$KEY_SOURCE" \
    "$SSL_DIR/eliteinnovates_com.key"
else
  sudo chown root:root "$SSL_DIR/eliteinnovates_com.key"
  sudo chmod 0600 "$SSL_DIR/eliteinnovates_com.key"
fi

sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
```

Only reload nginx if `nginx -t` succeeds. The nginx certificate paths are defined in `deployments/nginx.conf`. The deployment script checks the installed key against the public certificate, then copies the public certificate and CA bundle and generates the full chain from the selected remote Git commit. Commit and push renewed public certificate files before running that script, or it will restore the older public certificate. Keep the certificates outside `/var/www/elite-innovates/web`, which the app deployment replaces.

## 5. Verify the certificate served locally

These requests use the correct hostname and SNI while connecting directly to this VPS. They also verify the TLS chain and hostname:

```bash
curl --fail --show-error --silent --head \
  --resolve eliteinnovates.com:443:127.0.0.1 \
  https://eliteinnovates.com/
curl --fail --show-error --silent --head \
  --resolve www.eliteinnovates.com:443:127.0.0.1 \
  https://www.eliteinnovates.com/

for DOMAIN in eliteinnovates.com www.eliteinnovates.com; do
  echo "$DOMAIN"
  openssl s_client -connect 127.0.0.1:443 -servername "$DOMAIN" \
    </dev/null 2>/dev/null |
    openssl x509 -noout -subject -issuer -serial -dates
done
openssl x509 -in "$LEAF" -noout -serial -dates
```

Confirm that both served serial numbers and expiry dates match the renewed leaf certificate. The `www` response should redirect to the apex domain. If public DNS points elsewhere, check the public site separately after the local checks pass.

## Rollback

If validation or the HTTPS checks fail after installation, restore the files from the **same** backup directory printed in step 3. Restore both files if both were changed:

```bash
sudo cp -p "$BACKUP_DIR/eliteinnovates_com.fullchain.pem" \
  "$SSL_DIR/eliteinnovates_com.fullchain.pem"
sudo cp -p "$BACKUP_DIR/eliteinnovates_com.crt" \
  "$SSL_DIR/eliteinnovates_com.crt"
sudo cp -p "$BACKUP_DIR/eliteinnovates_com.ca-bundle" \
  "$SSL_DIR/eliteinnovates_com.ca-bundle"
sudo cp -p "$BACKUP_DIR/eliteinnovates_com.key" \
  "$SSL_DIR/eliteinnovates_com.key"
sudo nginx -t
sudo systemctl reload nginx
```

For a first installation without backups, correct the certificate/key source files before reloading nginx. Do not reload an invalid configuration.

## Checklist

- [ ] Renewed leaf and CA bundle are present on the server.
- [ ] The certificate covers the apex and `www` names and has the expected expiry.
- [ ] The private key matches the leaf certificate.
- [ ] `openssl verify` reports `OK`.
- [ ] Existing installed files are backed up.
- [ ] The full chain and key are installed with permissions `0644` and `0600`.
- [ ] `sudo nginx -t` succeeds and nginx reloads.
- [ ] Both hostnames serve the renewed certificate over HTTPS.
