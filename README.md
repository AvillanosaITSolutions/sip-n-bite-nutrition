# Sip n Bite Nutrition

Monorepo for the Sip n Bite storefront, admin console, and API.

## Layout

```
apps/
  api/        NestJS + TypeORM + Postgres (Auth0 JWT, PayMongo, PhilSMS, nodemailer)
  web/        Vite + React + flowbite-react + zustand + react-hook-form + zod
packages/
  shared/     Shared zod schemas, enums, and types
```

## Stack

- **Auth**: Auth0 (social: Google, Facebook, Instagram). API validates RS256 JWTs via JWKS.
- **Roles**: `customer`, `pos-operator`, `admin`, `super-admin`. First user to sign in becomes `super-admin`; SuperAdmin can promote others from Admin → Users. Roles can also be pre-assigned by email via the `ROLE_EMAIL_MAP` env var (`email:role,email:role`), applied on login.
- **Test accounts**: `pnpm --filter @snb/api seed:users` pre-provisions one user per role and prints the credentials to create in Auth0. Auth is Auth0-only (no local passwords) — create the matching users in the Auth0 dashboard, keep `ROLE_EMAIL_MAP` in sync, and roles bind on first login.
- **DB**: Postgres, UUID PKs everywhere. `synchronize: true` in dev — generate proper migrations before production.
- **Payments**: PayMongo Checkout Sessions. Webhook at `POST /api/payments/paymongo/webhook` marks orders paid. **TODO**: verify the `Paymongo-Signature` header in production.
- **Notifications**: nodemailer (SMTP) + PhilSMS, fired on order paid.

## Local setup

```bash
pnpm install
cp .env.example .env       # fill in values; also create apps/web/.env with VITE_ vars
createdb snb               # or run a local Postgres container

pnpm dev:api               # NestJS on :3000
pnpm dev:web               # Vite on :5173
```

## Auth0 config

1. Create an Auth0 SPA Application — its Client ID goes in `VITE_AUTH0_CLIENT_ID`.
2. Create an Auth0 API with identifier matching `AUTH0_AUDIENCE` (e.g. `https://api.sipnbite.local`).
3. Enable Google, Facebook, and Instagram social connections on the tenant.
4. Allowed Callback URLs / Logout URLs / Web Origins: `http://localhost:5173` and your production origin.

## API surface

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/menu` | public | Available menu items |
| `GET` | `/api/menu/all` | admin | All items incl. unavailable |
| `POST/PATCH/DELETE` | `/api/menu[/:id]` | admin | Manage menu |
| `GET` | `/api/products` | public | Shop listing |
| `PATCH` | `/api/products/:id/stock` | admin | `{ delta: number }` |
| `GET` | `/api/users/me` | auth | Upserts the Auth0 user locally |
| `POST` | `/api/orders` | auth | Creates order + PayMongo checkout |
| `GET` | `/api/orders/mine` | auth | Customer order history |
| `GET` | `/api/orders` | admin | All orders |
| `PATCH` | `/api/orders/:id/status` | admin | Update status |
| `POST` | `/api/payments/paymongo/webhook` | public | PayMongo webhook |

## Deploying to your VPS

Typical setup: nginx → `apps/web` static build at `/`, reverse-proxy `/api` to the NestJS process (pm2 or systemd). Postgres on the same VPS or a managed instance. Point your PayMongo webhook at `https://yourdomain/api/payments/paymongo/webhook`.

## TODOs left intentionally

- Verify PayMongo webhook signature (HMAC-SHA256 of raw body with `PAYMONGO_WEBHOOK_SECRET`).
- Generate proper TypeORM migrations and turn `synchronize` off in prod.
- Image upload (S3 / R2 / local) for menu items and products.
- Capture phone number on first login so SMS notifications can actually fire.
- Harden CORS, rate limits, helmet.
