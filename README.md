# Presales App

A frontend-only application for product pricing and presales operations. Built with Vite + React + TypeScript, backed by Supabase for authentication and data.

## Contents

- Quick start
- Architecture overview
- Environment variables
- Authentication & authorization
- Logging
- Excel export
- Frontend routes
- Build, lint, and typecheck
- Docker

---

## Quick start

```bash
npm install
npm run dev   # Vite dev server on http://localhost:5173
```

Required environment variables (copy `.env.example` to `.env`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Architecture overview

- **Framework:** Vite + React 18 + TypeScript + Tailwind CSS
- **Entry:** `src/main.tsx`; shell and routing in `src/App.tsx`
- **State/contexts:** `SupabaseAuthContext` (Azure OIDC via Supabase), `ThemeContext`, `CartContext`, `ToastContext`
- **Data fetching:** browser fetch + TanStack Query
- **Logging:** `src/utils/logger.ts` structured logger

### Containers

- **Production image:** Nginx-based (`Dockerfile`), served on port 8080 inside the container
- **Dev with hot reload:** `docker-compose.dev.yml` (mounts source, Vite HMR)
- **Local production build:** `docker-compose.local.yml` (builds image locally, exposes port 8081)
- **Pull from registry:** `docker-compose.yml` (uses `ghcr.io/mathzb/presales-app:latest`)

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_API_BASE_URL` | No | External API base URL |
| `VITE_REFRESHTOKEN` | No | Token for external API auth |

> `VITE_*` variables are baked into the bundle at build time. Changing them requires a rebuild.

---

## Authentication & authorization

- Sign-in via Supabase OAuth provider `azure` (see `src/context/SupabaseAuthContext.tsx`)
- Roles are read from Supabase user/app metadata; `isAdmin` gates admin-only features
- Protected routes use `ProtectedRoute` component with `useSupabaseAuth().isAdmin`

---

## Logging

- Use `logger` from `src/utils/logger.ts` instead of raw `console.*`
- Supports structured log levels: `debug`, `info`, `warn`, `error`, `navigation`

---

## Excel export

- Location: `src/utils/excelExport.ts`
- Exports the current calculator cart to `.xlsx`
- Amounts are normalized per billing period: monthly or yearly depending on `showMonthly`
- Columns: product name, commitment term, quantity, unit cost, unit sale, discount, total cost, total sale, total profit
- Numeric cells are formatted; header row is frozen; output is compressed

---

## Frontend routes

| Path | Component | Notes |
|---|---|---|
| `/` | `Dashboard` | Overview stats and quick links |
| `/products` | `ProductList` | Browse and add products to cart |
| `/customers` | `Customers` | Customer list |
| `/customers/:id` | `CustomerDetail` | Customer detail + subscriptions |
| `/calculator` | `OverallCalculator` | Pricing calculator with Excel export |
| `/sales-overview` | `SalesOverview` | Admin-only sales summary |
| `/access-denied` | `AccessDenied` | Shown when role check fails |
| `*` | `NotFound` | 404 fallback |

---

## Build, lint, and typecheck

```bash
npm run typecheck   # TypeScript check (no emit)
npm run lint        # ESLint
npm run build       # Production build  dist/
npm run preview     # Serve dist/ locally
```

---

## Docker

**Dev (hot reload):**
```bash
docker-compose -f docker-compose.dev.yml up
```

**Local production build** (port 8081):
```bash
cp .env.example .env   # fill in variables
docker-compose -f docker-compose.local.yml up --build
```

**Pull from registry** (port 8080):
```bash
docker-compose up
```
