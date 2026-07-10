# @snb/mobile — Sip 'N Bite mobile app

React Native (Expo SDK 52, TypeScript) client for the Sip 'N Bite Nutrition API. Feature parity
with the web app:

- **Customer**: Home, Menu (search/filter/add to cart), Herbalife Shop (stock/preorder aware),
  Cart with full checkout (pickup/delivery, pay at hub with change preview, or PayMongo online
  payment), My Orders, Order detail with live status.
- **Staff** (role-gated via `/users/me`, entry points on the Account tab):
  - POS walk-in orders (`POST /orders/walkin`) — all staff roles
  - Dashboard (`/orders/stats/summary`) and order management (status + mark paid) — all staff roles
  - Menu & product CRUD incl. photo upload from the camera roll — admin / super-admin
  - User role management — super-admin only
- **Auth**: Auth0 (authorization code + PKCE via `expo-auth-session`), refresh token stored in
  SecureStore, same audience/domain/client as the web app.
- **Shared code**: enums and zod schemas come from `@snb/shared`, same as web + API.

## Running

```bash
pnpm install
pnpm dev:mobile          # from the repo root (builds @snb/shared first)
# or: cd apps/mobile && pnpm start
```

Then scan the QR code with Expo Go (Android/iOS) or press `a`/`i` for an emulator.

### Configuration

All runtime config lives in [app.json](app.json) under `expo.extra`:

| Key | Meaning |
| --- | --- |
| `apiUrl` | API origin. `http://localhost:3000` works on emulators on the same machine (use `http://10.0.2.2:3000` for the Android emulator). **On a physical device use your machine's LAN IP**, e.g. `http://192.168.1.10:3000`. |
| `auth0Domain` / `auth0ClientId` / `auth0Audience` | Same Auth0 tenant as `apps/web/.env`. |

Restart `expo start` after changing `app.json`.

### Auth0 setup (one-time)

The mobile app authenticates with a redirect back into the app, so the Auth0 application must
allow the mobile callback URLs. In the Auth0 dashboard → Applications → your app → Settings, add
to **Allowed Callback URLs** and **Allowed Logout URLs**:

```
snbmobile://redirect
exp://127.0.0.1:8081/--/redirect
exp://<your-lan-ip>:8081/--/redirect
```

(The `exp://` entries are what Expo Go uses during development — the exact value is printed as
`redirectUri` if login fails; the `snbmobile://` scheme is used by dev/production builds.)

Also make sure the Auth0 application type allows the **Authorization Code** grant with **PKCE**
(Native application type), and that **Refresh Token** grant + rotation is enabled so sessions
survive app restarts (`offline_access` scope is requested).

### Notes

- Online payment opens the PayMongo checkout in an in-app browser; order status updates flow in
  via the existing PayMongo webhook on the API, so pull-to-refresh the order screen after paying.
- Image upload uses `expo-image-picker` and posts to the same `/api/uploads/:bucket` endpoint.
- Cart persists locally via AsyncStorage (zustand `persist`), mirroring the web `snb-cart` store.
