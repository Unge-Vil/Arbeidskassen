# Local Development

> The current source of truth for running Arbeidskassen locally: apps, ports, route conventions, environment variables, and verification commands.

---

## Quick Start

```bash
pnpm install
pnpm dev
```

If you need the local database stack as well:

```bash
pnpm --filter @arbeidskassen/supabase db:start
pnpm --filter @arbeidskassen/supabase db:reset
```

---

## App Matrix

| App | Port | Local URL | Canonical path on primary domain | Current status |
| --- | --- | --- | --- | --- |
| `arbeidskassen` | `3000` | `http://localhost:3000` | `/` and `/{locale}/dashboard` | Public landing + shared login hub |
| `bookdet` | `3001` | `http://localhost:3001/no` | `/{locale}/bookdet` | Booking/admin surface |
| `organisasjon` | `3002` | `http://localhost:3002/no` | `/{locale}/organisasjon` | Core organization module |
| `sales-portal` | `3003` | `http://localhost:3003/no` | `/{locale}/sales-portal` | Partner and sales workspace |
| `today` | `3004` | `http://localhost:3004/no` | `/{locale}/today` | Shared coming-soon shell for daily operations |
| `teamarea` | `3005` | `http://localhost:3005/no` | `/{locale}/teamarea` | Preview collaboration feed shell |
| `backoffice` | `3099` | `http://localhost:3099/no` | `/{locale}/backoffice` | Internal platform admin |

### Route model

- The public landing page stays at `/`.
- Shared auth stays at `/login`.
- Authenticated module surfaces are localized: `/no/dashboard`, `/no/bookdet`, `/no/organisasjon`, `/no/today`, `/no/teamarea`, `/no/backoffice`, `/no/sales-portal`.
- In local development, shared navigation resolves cross-app links to separate localhost ports automatically.

---

## Environment Setup

Copy the `.env.example` files for the apps that currently require Supabase-backed auth/data:

```bash
cp apps/arbeidskassen/.env.example apps/arbeidskassen/.env.local
cp apps/organisasjon/.env.example apps/organisasjon/.env.local
cp apps/bookdet/.env.example apps/bookdet/.env.local
cp apps/backoffice/.env.example apps/backoffice/.env.local
cp apps/sales-portal/.env.example apps/sales-portal/.env.local
```

### Minimum variables

At minimum, these apps expect:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### Preview modules

- `today` currently renders a shared `ModuleComingSoonPage` shell.
- `teamarea` can run in preview mode locally even when Supabase variables are missing, so shell and UI work can continue without backend setup.

### Optional cross-app routing overrides

For custom deployments or same-domain setups, the repo supports app URL overrides such as:

- `ARBEIDSKASSEN_APP_URL`
- `BOOKDET_APP_URL`
- `ORGANISASJON_APP_URL`
- `TODAY_APP_URL`
- `TEAMAREA_APP_URL`
- `BACKOFFICE_APP_URL`
- `SALES_PORTAL_APP_URL`
- `NEXT_PUBLIC_BASE_PATH`

---

## Database Workflow

The Supabase CLI workspace lives in `packages/supabase` and its project files live in `packages/supabase/supabase`.

Common commands:

```bash
pnpm --filter @arbeidskassen/supabase db:start
pnpm --filter @arbeidskassen/supabase db:status
pnpm --filter @arbeidskassen/supabase db:reset
pnpm --filter @arbeidskassen/supabase generate-types
```

---

## Verification Before PRs

Run the repo quality gate before merging:

```bash
CI=1 pnpm verify
```

This runs the root `lint`, `test`, and `build` sequence across the monorepo.
