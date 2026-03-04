# Presales App – Monorepo Overview

This repository contains a full-stack application for product pricing and presales operations. It combines a Vite + React + TypeScript frontend with an ASP.NET Core 8 Web API backend (EF Core + Npgsql targeting Supabase Postgres). Containers are provided for local development and production deployment.

## Contents

- Quick start (dev)
- Architecture overview (frontend, backend, containers)
- Environment variables
- Authentication & authorization
- Logging & observability (Sentry)
- Microsoft Incentives: data, calculation rules, UI
- Excel export
- Database & migrations
- API endpoints
- Frontend routes & UX
- Build, lint, and typecheck
- Docker & deployment
- Troubleshooting

---

## Quick start (dev)

Frontend (from repo root):

1. Install deps: `npm install`
2. Set env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (optional: `VITE_SENTRY_DSN`)
3. Run: `npm run dev` (Vite on port 5173)

Backend (from `backend/`):

1. Ensure a Supabase Postgres URL (ConnectionStrings:SupabaseConnection)
2. Run: `dotnet run` (Swagger at `/`)

Docker (optional):

- Frontend dev: `docker-compose -f docker-compose.dev.yml up`
- Backend dev: `docker-compose -f docker-compose.backend.yml up`

Build and checks:

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Frontend build: `npm run build`; preview: `npm run preview`

---

## Architecture overview

### Frontend

- Vite + React + TypeScript + Tailwind
- Entry: `src/main.tsx`; shell and routes in `src/App.tsx`
- State/contexts: SupabaseAuthContext (Azure OIDC via Supabase), AuthContext, ThemeContext, CartContext, ToastContext
- HTTP: browser fetch + TanStack Query for data fetching and caching
- Observability: `src/utils/logger.ts` structured logger; Sentry enabled when `VITE_SENTRY_DSN` is provided

### Backend

- ASP.NET Core 8 Web API + EF Core (Npgsql) targeting Supabase Postgres
- Key files: `backend/Program.cs`, `backend/Data/AppDbContext.cs`, `backend/Controllers/MicrosoftIncentivesController.cs`
- DTO mapping via extension methods in `backend/Mapping/MappingExtensions.cs` (ToDto / ToEntity / UpdateFromDto)
- Swagger: served at `/` in development
- CORS: allows `http://localhost:5173`, `http://localhost:8888`, and production host

### Containers

- Frontend: Nginx-based image in prod (`Dockerfile`); dev compose mounts code with hot reload (`docker-compose.dev.yml`)
- Backend: own image (`backend/Dockerfile`) and compose (`docker-compose.backend.yml`)

---

## Environment variables

Frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Optional Sentry: `VITE_SENTRY_DSN` (and for CI source maps: `VITE_SENTRY_ORG`, `VITE_SENTRY_PROJECT`, `VITE_SENTRY_AUTH_TOKEN`)

Backend:

- `ConnectionStrings__SupabaseConnection` (or appsettings.json key `ConnectionStrings:SupabaseConnection`)

Notes:

- App applies EF migrations on startup and seeds minimal data via `SeedData.Initialize`.
- Handle transient DB outages gracefully—startup logs failures without crashing.

---

## Authentication & authorization

- Sign-in with Supabase OAuth provider `azure` (see `SupabaseAuthContext.tsx`)
- Roles from user/app metadata; use `isAdmin` for admin-only features
- Admin-only pages are gated via `ProtectedRoute` and `useSupabaseAuth().isAdmin`

---

## Logging & observability (Sentry)

- Use `logger` from `src/utils/logger.ts` (prefer over raw console)
- Sentry initialized in `src/main.tsx` and only active when `VITE_SENTRY_DSN` is set
- In production, logs may be forwarded via `logger.sendToLoggingService`

---

## Microsoft Incentives

Data flow:

- Backend entity/model: `backend/Models/MicrosoftIncentive.cs` with EF migrations in `backend/Migrations/*`
- DTOs: `backend/DTOs/*.cs`; controller IO uses DTOs only
- Frontend admin page: `src/components/MicrosoftIncentives/MicrosoftIncentivesList.tsx`
- API routes: `/api/MicrosoftIncentives` and `/api/MicrosoftIncentives/categories`

Calculation rules:

- Treat `incentivePercentage` and `baseIncentive` as percentages; sum them to a total incentive percent
- Compute incentive delta on the base (undiscounted) sale price
- Do not apply incentives to discounted sale values; customer sale totals exclude incentives
- Show the incentive delta separately (e.g., green panel); don’t inflate customer totals with incentives

UI behavior:

- “Total salg” (and product “Total årlig”) exclude incentives
- Admin panel surfaces active incentives and their combined totals

Gotcha:

- In EF mapping, `MicrosoftIncentive.ValidTo` is intentionally mapped to a misspelled column `VaildTo`—don’t rename without a migration

---

## Excel export

- Location: `src/utils/excelExport.ts`
- Per-billing normalization based on commitment term:
  - If `showMonthly` is true, unit amounts are normalized per month
  - If false, unit amounts are normalized per year
- Columns include unit and total prices, discount, and a separate “Global Incentive (%)” (defaults to 0; per-item incentives stay in-app)
- Numeric cells are formatted; header is frozen; output is compressed

---

## Database & migrations

- EF Core migrations applied automatically on startup
- Minimal seed data via `SeedData.Initialize`
- Dates: ValidFrom/ValidTo stored as `date`
- Decimal precision configured on percentage/base fields

---

## API endpoints (Microsoft Incentives)

Route prefix: `api/[controller]`

- `GET /api/MicrosoftIncentives` — list, with optional filters `isActive` and `category`
- `GET /api/MicrosoftIncentives/{id}` — get single
- `POST /api/MicrosoftIncentives` — create
- `PUT /api/MicrosoftIncentives/{id}` — update
- `DELETE /api/MicrosoftIncentives/{id}` — delete
- `GET /api/MicrosoftIncentives/categories` — list categories

All endpoints return DTOs (`MicrosoftIncentiveDto`). Use mapping extensions for conversions.

---

## Frontend routes & UX

- Central routing in `src/App.tsx`; navigation also logs route changes
- Admin-only routes hidden or gated by `isAdmin`
- Pricing cards show per-billing amounts (monthly/yearly) with quantity and discount controls
- Incentive deltas indicated separately for transparency

---

## Build, lint, and typecheck

- `npm run typecheck` — TypeScript checks
- `npm run lint` — ESLint
- `npm run build` — production build
- `npm run preview` — serve built frontend locally

Backend:

- `dotnet build` / `dotnet run` / `dotnet watch run`

---

## Docker & deployment

- Frontend image is published to GHCR (see `docker-compose.yml` referencing `ghcr.io/mathzb/presales-app:latest`)
- Backend ships as a separate container (`backend/Dockerfile`)
- For dev, prefer compose files:
  - Frontend: `docker-compose.dev.yml`
  - Backend: `docker-compose.backend.yml`

---

## Troubleshooting

- CORS: ensure your frontend origin is listed in the backend CORS policy `AllowFrontend`
- Sentry: only active if `VITE_SENTRY_DSN` is set; verify DSN and environment
- DB connection: supply `ConnectionStrings__SupabaseConnection`; on startup, migrations apply and seed data is attempted
- Price mismatches: remember incentives are computed on base (undiscounted) amounts and shown separately; “Total salg” excludes incentives

---

## Contributing notes

- Prefer `logger.createScopedLogger("ComponentName")` and `logger.apiRequest/apiResponse` around fetches
- Follow DTO mapping patterns for any new backend endpoints
- Keep env vars and compose files in sync; avoid committing real secrets

---

For AI agents: see `.github/copilot-instructions.md` for repo-specific patterns and gotchas.
