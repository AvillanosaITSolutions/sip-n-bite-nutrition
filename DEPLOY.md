# Deployment guide

Target: **VPS at 88.222.245.88** running Ubuntu/Debian, deployed via **GitHub Actions** → **GHCR** → **docker compose** with **Traefik** + **Let's Encrypt** for HTTPS.

## Stack

```
                ┌──────────────────────────────────────┐
                │  GitHub Actions (deploy.yml)         │
                │   build api + web → push to GHCR     │
                │   SSH to VPS → compose pull && up    │
                └──────────────────────────────────────┘
                                  │
                                  ▼
       ┌─────────────────────────────────────────────────┐
       │  VPS 88.222.245.88                              │
       │  ┌────────────────────────────────────────────┐ │
       │  │  Traefik (80/443) — ACME / Let's Encrypt   │ │
       │  └─────────┬─────────────────────┬────────────┘ │
       │            │                     │              │
       │       sipnbite.com         api.sipnbite.com     │
       │            ▼                     ▼              │
       │      ┌──────────┐         ┌────────────┐        │
       │      │  web     │         │   api      │        │
       │      │  nginx   │         │  NestJS    │        │
       │      └──────────┘         └─────┬──────┘        │
       │                                 ▼               │
       │                          ┌────────────┐         │
       │                          │  postgres  │         │
       │                          └────────────┘         │
       └─────────────────────────────────────────────────┘
```

## One-time VPS setup

1. **DNS** — point these A records at `88.222.245.88`:
   - `sipnbite.example.com` → web
   - `api.sipnbite.example.com` → api

2. **Bootstrap the server** (as root over SSH):

   ```bash
   ssh root@88.222.245.88
   curl -fsSL https://raw.githubusercontent.com/<you>/sip-n-bite-nutrition/main/scripts/vps-bootstrap.sh | bash
   ```

   This installs Docker, creates a `deploy` user, sets up the firewall (22/80/443).

3. **Configure `.env` on the VPS:**

   ```bash
   ssh deploy@88.222.245.88
   cd ~/snb
   # paste in real values from .env.production.example
   nano .env
   chmod 600 .env
   ```

4. **Add the GitHub deploy key:**

   On your workstation:
   ```bash
   ssh-keygen -t ed25519 -f gh-deploy-key -C "github-actions"
   ```

   - Append `gh-deploy-key.pub` to `/home/deploy/.ssh/authorized_keys` on the VPS.
   - Copy the **private key** content (`cat gh-deploy-key`) into the GitHub repo secret `VPS_SSH_KEY`.

## GitHub repo secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `VPS_HOST` | `88.222.245.88` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | private key (the file content, including BEGIN/END lines) |
| `DOMAIN_API` | `api.sipnbite.example.com` |
| `AUTH0_DOMAIN` | your Auth0 tenant domain |
| `AUTH0_CLIENT_ID` | SPA client ID |
| `AUTH0_AUDIENCE` | the API audience |

The standard `GITHUB_TOKEN` is automatically available for pushing to GHCR.

## Deploying

```bash
git push origin main
```

That's it. Actions will:

1. Build the `api` and `web` Docker images
2. Push them to `ghcr.io/<repo>/api:<sha7>` and `:latest`
3. SCP `docker-compose.prod.yml` to the VPS
4. SSH in, write `IMAGE_TAG` to `~/snb/.env`, run `docker compose pull` + `up -d`
5. Traefik picks up the new containers, issues / renews certs via Let's Encrypt

First deploy takes ~3 min (image build) + 30 s (cert issuance). Subsequent deploys hit cache and complete in <60 s.

## Operating

```bash
ssh deploy@88.222.245.88
cd ~/snb

# Live logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web

# Quick health
docker compose -f docker-compose.prod.yml ps

# Database shell
docker compose -f docker-compose.prod.yml exec postgres psql -U snb -d snb

# Manual restart of a single service
docker compose -f docker-compose.prod.yml restart api

# Roll back to a specific image tag
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=abc1234/' .env
docker compose -f docker-compose.prod.yml up -d
```

## Notes

- **Uploads** are persisted in the named Docker volume `snb-uploads` — survives container rebuilds. Back this up periodically with `docker run --rm -v snb-prod_snb-uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-$(date +%F).tgz -C /data .`.
- **TLS certificates** are stored in `traefik-letsencrypt` volume. Don't delete it or Let's Encrypt will re-issue and hit rate limits.
- **Database schema** — production runs **migrations**, not `synchronize`. The api image bundles compiled migrations in `dist/migrations/`, and `migrationsRun: true` makes TypeORM apply any pending ones automatically on container start. To add a new migration, generate it locally:

  ```bash
  pnpm --filter @snb/api migration:generate src/migrations/AddSomething
  pnpm --filter @snb/api build
  git add apps/api/src/migrations && git commit -m "feat(db): add something"
  git push   # CI rebuilds → next deploy applies it on boot
  ```

  Dev environments still use `synchronize: true` (toggled off when `NODE_ENV=production`), so locally you can iterate freely.
- **Let's Encrypt requires a real domain** — it won't issue certs for raw IPs. If you can't get a domain immediately, use [duckdns.org](https://duckdns.org) for a free subdomain.
