# Deployment Runbook

> Operational deployment guide for Arbeidskassen with a monolith-first topology and optional per-module infrastructure.

---

## Deployment Decision

The product default is **one primary domain** with canonical paths:

- `/` (public landing)
- `/login` (shared auth)
- `/{locale}/dashboard`
- `/{locale}/bookdet`, `/{locale}/organisasjon`, `/{locale}/today`, `/{locale}/teamarea`, `/{locale}/backoffice`, `/{locale}/sales-portal`

Current Vercel root config deploys the main app only:

- Build target: `@arbeidskassen/web`
- Output dir: `apps/arbeidskassen/.next-build`

See [vercel.json](../vercel.json) and [apps/arbeidskassen/next.config.ts](../apps/arbeidskassen/next.config.ts).

---

## Topologies

## A) Monolith-First (Recommended)

One Vercel project deploys the main app (`apps/arbeidskassen`).
All module entry paths are served under the same primary domain.

Use when:

- Team is optimizing for reliability and low ops overhead
- You want one release pipeline and one rollback point
- Modules do not require independent scaling/deployment cadences yet

## B) Optional Per-Module Infrastructure (Advanced)

The main app can proxy module routes to separate URLs via environment variables in [apps/arbeidskassen/next.config.ts](../apps/arbeidskassen/next.config.ts):

- `BOOKDET_APP_URL`
- `ORGANISASJON_APP_URL`
- `TODAY_APP_URL`
- `TEAMAREA_APP_URL`
- `BACKOFFICE_APP_URL`
- `SALES_PORTAL_APP_URL`

Use when:

- A module needs isolated deploy cadence or incident isolation
- You accept higher operational complexity

Important:

- Canonical user-facing paths remain unchanged (`/{locale}/{module}`)
- Proxy destinations must be full `http(s)://` URLs

---

## Environment Variable Matrix

## Required in app runtimes

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

## Optional for route proxying in main app

- `ARBEIDSKASSEN_APP_URL`
- `BOOKDET_APP_URL`
- `ORGANISASJON_APP_URL`
- `TODAY_APP_URL`
- `TEAMAREA_APP_URL`
- `BACKOFFICE_APP_URL`
- `SALES_PORTAL_APP_URL`
- `NEXT_PUBLIC_BASE_PATH`

## Where to set secrets

- Local: `apps/*/.env.local` (from `.env.example`)
- Vercel Preview: project environment variables for Preview
- Vercel Production: project environment variables for Production

---

## Monolith-First Release Procedure

1. Validate branch locally:
   - `CI=1 pnpm verify`
2. Confirm migrations are safe and committed under `packages/supabase/supabase/migrations`.
3. Open PR and verify preview deployment.
4. Merge to `main`.
5. Verify production:
   - `/`
   - `/login`
   - `/no/dashboard`
   - `/no/bookdet`
   - `/no/organisasjon`
6. Run post-release smoke checks:
   - Login redirect behavior
   - Tenant selection flow
   - Cross-app navigation from dashboard links

---

## Rollback Procedure

If a deploy introduces regressions:

1. Roll back the Vercel deployment to last known good release.
2. If DB migration caused issues:
   - Create a forward-fix migration (preferred)
   - Avoid editing historical migration files
3. Re-verify core routes:
   - `/login`
   - `/no/dashboard`
   - Module entry paths
4. Capture incident notes and root cause in PR/issue.

---

## Pre-Deploy Checklist

- [ ] `CI=1 pnpm verify` passes
- [ ] App middleware still uses shared matcher and policy presets
- [ ] New env vars are defined in Preview and Production
- [ ] No doc/code mismatch for newly announced features
- [ ] Core routes and auth redirects manually validated

---

## Notes

- This runbook describes operational steps for current architecture; it does not redefine product URLs.
- For development protocols and migration rules, see [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md).
