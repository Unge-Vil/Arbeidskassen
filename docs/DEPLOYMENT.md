# Deployment Runbook

> Operational deployment guide for Arbeidskassen — a single consolidated Next.js app deployed to Vercel.

---

## Deployment Architecture

All modules are consolidated into a single Next.js app (`apps/arbeidskassen`). One Vercel project, one build, one deploy.

Canonical paths on the primary domain:

- `/` (public landing)
- `/login` (shared auth)
- `/{locale}/dashboard`
- `/{locale}/bookdet`, `/{locale}/organisasjon`, `/{locale}/today`, `/{locale}/teamarea`, `/{locale}/backoffice`, `/{locale}/sales-portal`

Build target: `@arbeidskassen/web`
Output dir: `apps/arbeidskassen/.next-build`

See [vercel.json](../vercel.json) and [apps/arbeidskassen/next.config.ts](../apps/arbeidskassen/next.config.ts).

---

## Future: BookDet on Custom Domain

When BookDet needs its own domain (e.g., `bookdet.no`), this can be achieved via Vercel rewrites without splitting the app:

```typescript
// In next.config.ts
{
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/book/:slug*",
          destination: "/no/book/:slug*",
          has: [{ type: "host", value: "bookdet.no" }],
        },
      ],
    };
  },
}
```

---

## Environment Variable Matrix

### Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

### Where to set secrets

- Local: `apps/arbeidskassen/.env.local` (from `.env.example`)
- Vercel Preview: project environment variables for Preview
- Vercel Production: project environment variables for Production

---

## Release Procedure

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
   - `/no/teamarea`
   - `/no/today`
   - `/no/backoffice`
   - `/no/sales-portal`
6. Run post-release smoke checks:
   - Login redirect behavior
   - Tenant selection flow
   - Module navigation from dashboard links

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
- [ ] Middleware protects all module prefixes
- [ ] New env vars are defined in Preview and Production
- [ ] No doc/code mismatch for newly announced features
- [ ] Core routes and auth redirects manually validated

---

## Notes

- This runbook describes operational steps for the consolidated single-app architecture.
- For development protocols and migration rules, see [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md).
