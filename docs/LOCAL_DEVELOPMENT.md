# Local Development

> The current source of truth for running Arbeidskassen locally: routes, environment variables, and verification commands.

---

## Quick Start

```bash
pnpm install
pnpm --filter @arbeidskassen/supabase db:start
pnpm --filter @arbeidskassen/web dev
# Open http://localhost:3000
```

---

## Route Map

All modules run under a single Next.js app on port `3000`.

| Route | Description |
| --- | --- |
| `/` | Public landing page |
| `/login` | Shared authentication |
| `/{locale}/select-tenant` | Tenant selection |
| `/{locale}/dashboard` | Dashboard with module grid |
| `/{locale}/profil` | Profile settings |
| `/{locale}/bookdet` | Booking module (BookDet) |
| `/{locale}/organisasjon` | Core organization module |
| `/{locale}/teamarea` | Collaboration feed |
| `/{locale}/today` | Daily operations workspace |
| `/{locale}/backoffice` | Platform admin |
| `/{locale}/sales-portal` | Sales & partner portal |

All authenticated routes live under `app/[locale]/(authenticated)/` and share a single middleware, layout shell, and auth guard.

---

## Environment Setup

Copy the example file:

```bash
cp apps/arbeidskassen/.env.example apps/arbeidskassen/.env.local
```

### Required variables

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Preview modules

- `today` currently renders a `ModuleComingSoonPage` placeholder.
- `teamarea` shows a preview feed shell.

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
