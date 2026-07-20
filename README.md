# ArtDera Global Canvas

ArtDera is a TanStack Start + React marketplace frontend for buyers, artists, galleries and marketplace administrators. This phase runs entirely with typed mock repositories and browser persistence; no payment, identity, email, SMS, courier or database provider is connected.

## Run locally

```bash
npm install
npm run dev
```

## Demo accounts

These credentials are for development and product testing only.

| Role                  | Email                              | Password            | Destination         |
| --------------------- | ---------------------------------- | ------------------- | ------------------- |
| Free artist           | `free.artist@artdera.demo`         | `FreeArtist@2026`   | `/artist/dashboard` |
| Professional artist   | `professional.artist@artdera.demo` | `Professional@2026` | `/artist/dashboard` |
| Pro Plus artist       | `pro.artist@artdera.demo`          | `ProArtist@2026`    | `/artist/dashboard` |
| Gallery               | `gallery@artdera.demo`             | `GalleryDemo@2026`  | `/artist/dashboard` |
| Legacy artist fixture | `artist@artdera.demo`              | `ArtistDemo@2026`   | `/artist/dashboard` |
| Buyer                 | `buyer@artdera.demo`               | `BuyerDemo@2026`    | `/account`          |
| Admin                 | `admin@artdera.demo`               | `AdminDemo@2026`    | `/admin`            |

The public login page intentionally excludes admin quick-fill credentials. Seeded passwords are compared through SHA-256 demo hashes and are never written as plaintext to browser storage. Client-side authentication and route guards are not production security; future backend authorization must protect every private operation.

The seller signup verification code is `123456` in demo mode only.

## Frontend architecture

- `src/marketplace/types.ts`: typed marketplace models and centralized statuses.
- `src/config/subscription-plans.ts`: the single source of truth for prices, billing options, limits, commission, features and plan permissions.
- `src/marketplace/config.ts`: promotions, routes, roles and permissions; it re-exports the central plan configuration for existing screens.
- `src/marketplace/data.ts`: realistic Pakistani demo data.
- `src/marketplace/services.ts`: API interface, mock client, storage abstraction and domain services.
- `src/marketplace/auth.tsx`: replaceable session authentication adapter.
- `src/marketplace/dashboard.tsx`, `buyer.tsx`, `admin.tsx`: role-aware workspaces.

Browser storage keys are namespaced under `artdera.demo.v1`. No real card, bank, CNIC or tax information should be entered into this demo.

## Artist subscription flow

The working frontend journey is `/sell` → `/sell/plans` → `/artist/signup` → `/artist/verify`. Free accounts activate without a transaction and continue to `/artist/onboarding`. Professional, Pro Plus and Gallery accounts continue through `/artist/checkout`, `/artist/payment-success`, onboarding and `/artist/store-created` before entering `/artist/dashboard`.

`SubscriptionService`, `PlanService`, `FeatureAccessService`, `PaymentService` and `InvoiceService` are implemented in `src/marketplace/services.ts`. They persist non-sensitive demo state through the storage abstraction. Card numbers, CVV values, wallet details, receipt contents, raw passwords and identity documents are never persisted.
