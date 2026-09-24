# Elite Innovates — Angular SSR deployment

These files target the existing Linux VPS running nginx and systemd. This is a frontend-only Angular application: there is no .NET service, API upstream, database migration or API environment variable.

## Deployment values

| Setting | Value |
| --- | --- |
| Canonical website | `https://eliteinnovates.com` |
| Redirected alias | `https://www.eliteinnovates.com` |
| SSR listener | `127.0.0.1:4300` |
| Application files | `/var/www/elite-innovates/web` |
| Node executable | Node.js 26+ found on the deployment user’s `PATH` (or `NODE_BINARY` override) |
| Unit | `/etc/systemd/system/elite-innovates.service` |
| nginx vhost | `/etc/nginx/conf.d/eliteinnovates.com.conf` |
| Default Git branch | `master` |
| Backups | `/var/www/elite-innovates/backup/<timestamp>-<commit>-<pid>` |

Ports 4000, 4100, 4200 and 5000 belong to the other applications. Port 4300 is a proposed allocation; the script checks it on the VPS and refuses to kill an existing process. Change the port in **all three deployment files** if 4300 is already allocated.

The repository is at `/var/www/elite-innovates/eliteinnovates`. The script finds its repository from its own location. The built browser and server files are deployed to `/var/www/elite-innovates/web`; nginx serves files from its `browser` directory. The public certificate, CA bundle and generated full chain are installed in `/var/www/elite-innovates/ssl`, outside the replaced web directory.

## First-time setup

1. Install Node.js 26 or newer, npm, Git, curl, rsync, OpenSSL and the normal Linux `ss`/`flock`/`runuser` utilities. nginx and systemd must be available, and the `www-data` user/group must exist. Run the script as a deployment user with sudo access and Git access to this repository. The script selects Node 26 or newer from the current `PATH` or common Ubuntu locations (`/usr/local/bin/node`, `/usr/bin/node`, `/usr/bin/nodejs`, and common Node 26 paths), uses it for npm and the build, and writes that same absolute Node path into the systemd unit. If Node 26 is installed elsewhere, set `NODE_BINARY=/absolute/path/to/node26` when running the script. That binary must be executable by `www-data`. If only an older version is installed, the script reports its version and stops before changing the running site.
2. Point both `eliteinnovates.com` and `www.eliteinnovates.com` to the VPS. The certificate must cover both names.
3. Install the matching private key before deploying. The supplied public certificate and CA bundle are in `deployments/certs/`; the deployment script copies them and generates the full chain in `/var/www/elite-innovates/ssl`. The private key is not included and must be supplied separately. Run from the repository root:

   ```bash
   sudo install -d -m 755 /var/www/elite-innovates/ssl
   sudo install -m 600 -o root -g root /path/to/your/private-key.key \
     /var/www/elite-innovates/ssl/eliteinnovates_com.key
   ```

   Replace `/path/to/your/private-key.key` with the actual key location. Keep private keys outside Git. The deployment script verifies that it matches the certificate. If the key is already installed at the old path, move it to the new path with `sudo install -m 600 -o root -g root /var/www/elite-innovates/eliteinnovates/ssl/eliteinnovates_com.key /var/www/elite-innovates/ssl/eliteinnovates_com.key`. Deployments replace the installed public certificate, CA bundle and full chain from the selected remote commit, but leave the private key in place. Commit and push renewed public certificate files before the next app deployment so it does not restore an older certificate.

   For subsequent renewals, follow [renew_ssl.md](renew_ssl.md).

4. Ensure `/etc/nginx/nginx.conf` includes `/etc/nginx/conf.d/*.conf` inside its `http` block, as in the reference application. If an Elite Innovates vhost already exists in `sites-enabled` or under another filename, consolidate it before running this script so there is only one vhost for these names. Leave the other applications' vhosts in place.
5. Commit and push these files **and the `src/server.ts` loopback change** to the branch you intend to deploy.

## Deploy

```bash
bash deployments/deploy-script.sh master
# Or choose another existing remote branch:
# bash deployments/deploy-script.sh release
```

The script fetches the selected remote branch and builds a temporary archive of that exact commit with `npm ci --include=dev` and the production build. It does not reset, rebase or switch the source checkout, so uncommitted files are not included in the deployed build. It uses the same checked Node 26+ binary for npm scripts and the running systemd service.

It then backs up the current app, public TLS files and configuration; installs the checked public certificate, CA bundle and generated full chain in `/var/www/elite-innovates/ssl`; checks the candidate vhost with `nginx -t`; stops only `elite-innovates.service`; installs `dist/eliteinnovates/browser` and `dist/eliteinnovates/server`; and starts Node. There is a short restart window during activation; building happens while the previous app is running.

The checks require rendered homepage, services and portfolio content using the real domain and trusted forwarded headers. The final HTTPS check goes through local nginx using `curl --resolve`, with certificate verification enabled. Only after those checks pass is the deployed commit recorded. Activation failures restore the previous app, public TLS files and configuration; a first deployment has no prior app to restore. Timestamped backups are retained for manual cleanup after successful deployments.

## Simple redeploy after first setup

Use `redeploy-script.sh` when the service, nginx vhost and TLS files are already installed. It fetches and rebases the checked-out branch, runs `npm ci` and a production Angular SSR build while the current site stays up, stages the build, stops only `elite-innovates.service`, replaces `/var/www/elite-innovates/web`, starts the service and checks the rendered homepage. If activation fails, it restores the previous `web` directory. It leaves the installed certificate, service unit and nginx configuration unchanged.

```bash
NODE_BINARY=/opt/node-v26.9.0/bin/node bash deployments/redeploy-script.sh master
```

The checkout must be on `master` with no uncommitted changes to tracked files before rebasing. For a different branch, check it out first and pass its name to the script. nginx does not need a reload for a code-only redeploy. If you changed the installed nginx configuration separately, set `RELOAD_NGINX=1` to validate and reload it after the service is healthy; this reloads nginx without restarting the other sites on the shared server.

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
