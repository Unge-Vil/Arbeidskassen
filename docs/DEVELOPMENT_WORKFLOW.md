# Development Workflow

> Protocols for safe development in a growing monorepo — database migrations, blast radius analysis, branching strategy, and deployment isolation.

---

## Table of Contents

- [Overview](#overview)
- [Database Migrations](#database-migrations)
- [Blast Radius Principle](#blast-radius-principle)
- [Branching Strategy](#branching-strategy)
- [Deployment Pipeline](#deployment-pipeline)

---

## Overview

As the Arbeidskassen monorepo grows in apps and contributors, a single careless change to a shared package or database schema can cascade failures across the entire platform. This document establishes strict protocols to prevent regressions.

The core rule: **every change must be evaluated for its blast radius before implementation.**

---

## Database Migrations

### Supabase CLI Only

All database schema changes — tables, columns, indexes, RLS policies, functions, triggers — are managed exclusively through **Supabase CLI migrations**.

```bash
# Create a new migration
supabase migration new <descriptive-name>

# Apply migrations locally
supabase db reset

# Push to remote (staging/production)
supabase db push
```

### Rules

| Rule | Details |
| --- | --- |
| **No manual dashboard changes** | Never use the Supabase Dashboard to modify production schemas. Dashboard edits are unversioned and unreproducible. |
| **Migration files are immutable** | Once a migration is committed and pushed, it must never be edited. Create a new migration to fix issues. |
| **Descriptive names** | Use timestamps + intent: `20260409120000_add_shifts_table.sql`, `20260409130000_add_rls_to_shifts.sql`. |
| **One concern per migration** | Separate schema changes from RLS policies from seed data. This makes rollbacks granular. |
| **Down migrations** | Include reversible SQL where possible (`DROP TABLE IF EXISTS`, `ALTER TABLE DROP COLUMN`). |
| **RLS from day one** | Every `CREATE TABLE` migration must include `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, and at least the four standard RLS policies (SELECT, INSERT, UPDATE, DELETE). |

### Migration File Structure

```
supabase/
├── config.toml              # Supabase project configuration
├── migrations/
│   ├── 20260101000000_create_tenants.sql
│   ├── 20260101000001_create_tenant_members.sql
│   ├── 20260101000002_rls_tenants.sql
│   ├── 20260115000000_create_bookings.sql
│   └── ...
├── seed.sql                 # Development seed data (never applied in production)
└── tests/                   # pgTAP tests for RLS policies and functions
    ├── rls_tenants_test.sql
    └── rls_bookings_test.sql
```

### Safe Schema Change Patterns

| Change Type | Safe Approach | Dangerous Approach |
| --- | --- | --- |
| **Add column** | `ALTER TABLE ADD COLUMN ... DEFAULT ...` | Adding `NOT NULL` without default (breaks existing rows) |
| **Rename column** | Create new column → migrate data → drop old column (across 3 migrations) | `ALTER TABLE RENAME COLUMN` (breaks all queries using old name) |
| **Remove column** | Verify no app references it → `ALTER TABLE DROP COLUMN` | Dropping without checking consumers |
| **Add RLS policy** | Add new policy alongside existing ones | Replacing existing policy (may lock out users) |
| **Modify function** | `CREATE OR REPLACE FUNCTION` with backward-compatible signature | Changing parameter types/order |
| **Add index** | `CREATE INDEX CONCURRENTLY` (non-blocking) | `CREATE INDEX` (locks table during creation) |

---

## Blast Radius Principle

### Definition

The **blast radius** of a change is the set of all apps, packages, and database queries that are affected by it. Before implementing any change to shared code or schema, you must identify and document the blast radius.

### Shared Code Dependencies

```
packages/ui          → consumed by ALL apps (arbeidskassen, bookdet, organisasjon, backoffice, sales-portal)
packages/supabase    → consumed by ALL apps
packages/config      → consumed by ALL apps + ALL packages
supabase/migrations  → affects ALL apps that query the modified tables
```

### Impact Assessment

Before modifying shared code, answer these questions:

1. **What consumes this?** List every `apps/*` that imports from the affected `packages/*`.
2. **What breaks if I change this?** If modifying a component's props, function signature, or database column — which call sites break?
3. **Can I add instead of modify?** Prefer adding new optional props, new columns with defaults, or new functions alongside existing ones.
4. **Does this need a migration?** If altering database schema, does a SQL migration file exist?

### Rules for Shared Packages

#### `packages/ui`

| Action | Rule |
| --- | --- |
| **Add new component** | Safe — no blast radius. Export it from `index.ts`. |
| **Add optional prop to existing component** | Safe — existing consumers are unaffected. |
| **Change required prop** | **DANGEROUS** — blast radius is every app using this component. Must update all call sites in the same PR. |
| **Remove prop** | **DANGEROUS** — search all `apps/` for usage first. Deprecate before removing. |
| **Change visual appearance** | Moderate risk — verify it looks correct in both Admin UI (compact) and Public UI (spacious) contexts. |
| **Update dependency** | Check all apps for peer dependency conflicts in `pnpm-lock.yaml`. |

#### `packages/supabase`

| Action | Rule |
| --- | --- |
| **Add new helper function** | Safe — no blast radius. |
| **Modify `createServerClient()` signature** | **CRITICAL** — every Server Component and Server Action in every app calls this. |
| **Update `Database` types** | Run `supabase gen types` after migration. Type errors reveal blast radius automatically. |
| **Change cookie handling** | **CRITICAL** — affects authentication across all apps. |

#### `packages/config`

| Action | Rule |
| --- | --- |
| **Add new ESLint rule** | Moderate — may cause lint failures across all apps. Run `pnpm lint` before committing. |
| **Change TypeScript `strict` settings** | **CRITICAL** — can surface hundreds of type errors across all apps. |
| **Update Prettier config** | Low risk — run `pnpm format` to auto-fix, but diff may be large. |

### Rules for Database Schema

| Action | Rule |
| --- | --- |
| **Add table** | Low risk — no existing queries reference it. Always include RLS. |
| **Add column with default** | Low risk — existing queries still work. |
| **Add column without default + NOT NULL** | **DANGEROUS** — breaks inserts that don't include the new column. |
| **Rename/remove column** | **CRITICAL** — search all `apps/` for `.from("table").select("column")` patterns. |
| **Modify RLS policy** | **CRITICAL** — can silently lock users out or expose cross-tenant data. Test with pgTAP. |
| **Add/modify function** | Moderate — check all `.rpc("function_name")` call sites. |

### Documenting Blast Radius

When proposing a change to shared code or schema, include a blast radius comment in the PR:

```markdown
## Blast Radius

**Changed:** `packages/ui` — `Button` component, added `loading` prop (optional)
**Consumers:** arbeidskassen, bookdet, organisasjon, backoffice, sales-portal
**Impact:** None — new prop is optional with `default: false`
**Breaking:** No
```

```markdown
## Blast Radius

**Changed:** `supabase/migrations/20260409_add_status_to_bookings.sql`
**Consumers:** bookdet (reads/writes `bookings`), arbeidskassen (reads `bookings` for admin view)
**Impact:** New `status` column with DEFAULT 'pending' — existing rows get default value
**Breaking:** No — but bookdet queries should be updated to SELECT the new column
```

---

## Branching Strategy

### Branch Types

| Branch | Pattern | Purpose | Lifetime |
| --- | --- | --- | --- |
| `main` | Protected | Production-ready code. All merges require PR review. | Permanent |
| `develop` | Protected | Integration branch. Feature branches merge here first. | Permanent |
| `feature/*` | `feature/bookdet-recurring` | New feature development. | Until merged to `develop` |
| `fix/*` | `fix/rls-policy-tenants` | Bug fix. | Until merged to `develop` |
| `hotfix/*` | `hotfix/billing-webhook` | Critical production fix. Merges to `main` directly. | Until merged to `main` |
| `migration/*` | `migration/add-shifts-table` | Database migration with schema changes. | Until merged to `develop` |

### Branch Rules

1. **Never commit directly to `main` or `develop`.** Always use a feature/fix branch.
2. **One concern per branch.** Don't mix a UI feature with a database migration.
3. **Prefix migration branches.** Branches with schema changes use `migration/` prefix to signal extra review is needed.
4. **Keep branches short-lived.** Merge within days, not weeks. Long-lived branches accumulate merge conflicts.

### PR Requirements

| Requirement | Details |
| --- | --- |
| **Blast radius comment** | Required for any change to `packages/*` or `supabase/migrations/`. |
| **Type check passes** | `pnpm build` must succeed (Turborepo builds all apps). |
| **Lint passes** | `pnpm lint` must pass across the entire monorepo. |
| **Migration tested** | If the branch includes a migration, `supabase db reset` must succeed with the full migration chain. |
| **Preview deployment** | Vercel deploys a preview for each PR. Verify the affected app(s) work. |

---

## Deployment Pipeline

### Environment Isolation

```
┌─────────────────────────────────────────────────────────┐
│                     Environments                         │
├──────────────┬──────────────┬───────────────────────────┤
│   Local      │   Preview    │   Production              │
├──────────────┼──────────────┼───────────────────────────┤
│ supabase     │ Supabase     │ Supabase                  │
│ start        │ Branch DB    │ Production DB             │
│ (Docker)     │ (isolated)   │ (protected)               │
├──────────────┼──────────────┼───────────────────────────┤
│ next dev     │ Vercel       │ Vercel                    │
│ (all apps)   │ Preview URL  │ Production URL            │
├──────────────┼──────────────┼───────────────────────────┤
│ Seed data    │ PR-scoped    │ Real customer data        │
│              │ test data    │ (GDPR protected)          │
└──────────────┴──────────────┴───────────────────────────┘
```

### Supabase Branching

Supabase Branching creates an isolated database for each Git branch, allowing safe migration testing without affecting production:

```bash
# Supabase automatically creates a branch database 
# when a PR is opened (if configured in the Supabase Dashboard).

# The preview deployment's SUPABASE_URL points to the branch database.
# Migrations in the PR are applied to the branch database automatically.

# When the PR is merged, migrations are applied to production.
```

### Vercel Preview Deployments

Each PR generates a preview URL per app. Turborepo's `affected` filter ensures only changed apps are rebuilt:

```bash
# Vercel detects which apps are affected by the PR's file changes
# and deploys only those apps to preview URLs.

# Example:
# PR changes packages/ui → all apps rebuilt (shared dependency)
# PR changes apps/bookdet only → only bookdet rebuilt
```

### Production Deployment

1. PR merged to `main`.
2. Turborepo builds affected apps.
3. Vercel deploys to production URLs.
4. Supabase applies pending migrations to production database.
5. Post-deploy verification: health checks on all affected apps.

### Rollback Plan

| Scenario | Action |
| --- | --- |
| **App regression** | Revert the merge commit on `main`. Vercel auto-deploys the previous version. |
| **Migration regression** | Create a new migration that reverses the change (never edit old migrations). |
| **RLS misconfiguration** | Hotfix branch with corrected policy. Test with pgTAP before deploying. |
| **Shared package break** | Revert the package change. Turborepo rebuilds all consumers. |
