# Elite Innovates — Angular SSR deployment

These files target the existing Linux VPS running nginx and systemd. This is a frontend-only Angular application: there is no .NET service, API upstream, database migration or API environment variable.

## Deployment values

| Setting | Value |
| --- | --- |
| Canonical website | `https://eliteinnovates.com` |
| Redirected alias | `https://www.eliteinnovates.com` |
| SSR listener | `127.0.0.1:4300` |
| Application files | `/var/www/elite-innovates/eliteinnovates/web` |
| Node executable | `/usr/bin/node` (Node.js 26+) |
| Unit | `/etc/systemd/system/elite-innovates.service` |
| nginx vhost | `/etc/nginx/conf.d/eliteinnovates.com.conf` |
| Default Git branch | `master` |
| Backups | `/var/www/elite-innovates/eliteinnovates/backup/<timestamp>-<commit>-<pid>` |

Ports 4000, 4100, 4200 and 5000 belong to the other applications. Port 4300 is a proposed allocation; the script checks it on the VPS and refuses to kill an existing process. Change the port in **all three deployment files** if 4300 is already allocated.

The repository can be cloned anywhere the deployment user can access, for example `/var/www/elite-innovates/eliteinnovates`. The script finds its repository from its own location. nginx serves files from the deployed `web/browser` directory, never from the source checkout.

## First-time setup

1. Install Node.js 26 or newer at `/usr/bin/node`, npm, Git, curl, rsync and the normal Linux `ss`/`flock` utilities. nginx and systemd must be available, and the `www-data` user/group must exist. Run the script as a deployment user with sudo access and Git access to this repository.
2. Point both `eliteinnovates.com` and `www.eliteinnovates.com` to the VPS. The certificate must cover both names.
3. Install the TLS chain and its matching private key before deploying. The supplied public certificate files are in `deployments/certs/`; the private key is not included. Run from the repository root:

   ```bash
   sudo install -d -m 755 /var/www/elite-innovates/eliteinnovates/ssl
   cat deployments/certs/eliteinnovates_com.crt deployments/certs/eliteinnovates_com.ca-bundle \
     | sudo tee /var/www/elite-innovates/eliteinnovates/ssl/eliteinnovates_com.fullchain.pem >/dev/null
   sudo chmod 644 /var/www/elite-innovates/eliteinnovates/ssl/eliteinnovates_com.fullchain.pem
   sudo install -m 600 -o root -g root /path/to/your/private-key.key \
     /var/www/elite-innovates/eliteinnovates/ssl/eliteinnovates_com.key
   ```

   Replace `/path/to/your/private-key.key` with the actual key location. Keep private keys outside Git. If you use a different certificate location or a renewal tool, update the nginx certificate paths and script preflight paths together. Deployments do not overwrite TLS files.

4. Ensure `/etc/nginx/nginx.conf` includes `/etc/nginx/conf.d/*.conf` inside its `http` block, as in the reference application. If an Elite Innovates vhost already exists in `sites-enabled` or under another filename, consolidate it before running this script so there is only one vhost for these names. Leave the other applications' vhosts in place.
5. Commit and push these files **and the `src/server.ts` loopback change** to the branch you intend to deploy.

## Deploy

```bash
bash deployments/deploy-script.sh master
# Or choose another existing remote branch:
# bash deployments/deploy-script.sh release
```

The script fetches the selected remote branch and builds a temporary archive of that exact commit with `npm ci --include=dev` and the production build. It does not reset, rebase or switch the source checkout, so uncommitted files are not included in the deployed build.

It then backs up the current app and its configuration, checks the candidate vhost with `nginx -t`, stops only `elite-innovates.service`, installs `dist/eliteinnovates/browser` and `dist/eliteinnovates/server`, and starts Node. There is a short restart window during activation; building happens while the previous app is running.

The checks require rendered homepage, services and portfolio content using the real domain and trusted forwarded headers. The final HTTPS check goes through local nginx using `curl --resolve`, with certificate verification enabled. Only after those checks pass is the deployed commit recorded. Activation failures restore the previous app and configuration; a first deployment has no prior app to restore. Timestamped backups are retained for manual cleanup after successful deployments.

## Operations

```bash
sudo systemctl status elite-innovates.service --no-pager
sudo journalctl -u elite-innovates.service -n 80 --no-pager
sudo systemctl restart elite-innovates.service
sudo nginx -t
sudo ss -ltnp 'sport = :4300'
```

Local rendered-content check:

```bash
curl --fail --silent --show-error \
  -H 'Host: eliteinnovates.com' \
  -H 'X-Forwarded-Host: eliteinnovates.com' \
  -H 'X-Forwarded-Proto: https' \
  -H 'X-Forwarded-For: 127.0.0.1' \
  http://127.0.0.1:4300/
```

The service's `NG_ALLOWED_HOSTS` and `NG_TRUST_PROXY_HEADERS` settings follow [Angular's SSR host and proxy guidance](https://angular.dev/best-practices/security#configuring-trusted-proxy-headers). The nginx [proxy header configuration](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header) matches that trust list. Stable asset filenames use short caching; only hashed build bundles use immutable caching. Page routes are proxied to Node rather than sent to a client-only `index.html` fallback.
