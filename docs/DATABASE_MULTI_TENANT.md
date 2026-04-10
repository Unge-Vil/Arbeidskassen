# Multi-Tenant Database Design

> How Arbeidskassen isolates data for multiple tenants within a single Supabase PostgreSQL database using a shared-schema approach with Row Level Security.

---

## Table of Contents

- [Strategy: Single Database, Shared Schema](#strategy-single-database-shared-schema)
- [Tenant Hierarchy](#tenant-hierarchy)
- [Schema Design](#schema-design)
- [The `tenant_id` Rule](#the-tenant_id-rule)
- [Row Level Security (RLS)](#row-level-security-rls)
- [User-Tenant Relationship](#user-tenant-relationship)
- [Query Patterns](#query-patterns)
- [Migration Guidelines](#migration-guidelines)
- [Trade-offs and Limits](#trade-offs-and-limits)

---

## Strategy: Single Database, Shared Schema

Arbeidskassen uses a **single Supabase project** with a **shared `public` schema** for all tenants. Every table that contains tenant-scoped data includes a `tenant_id` column, and PostgreSQL Row Level Security (RLS) policies enforce isolation at the database level.

### Why This Strategy

| Factor | Single DB / Shared Schema | Schema-per-Tenant | DB-per-Tenant |
| --- | --- | --- | --- |
| **Operational complexity** | Low | Medium | High |
| **Cost at scale** | Low (one Supabase project) | Medium | High |
| **Cross-tenant queries** | Easy (same schema) | Requires `SET search_path` | Requires federation |
| **Data isolation** | RLS-enforced (strong) | Schema-enforced (strong) | Physical (strongest) |
| **Migration effort** | One migration, all tenants | One migration per schema | One migration per DB |
| **Supabase compatibility** | Native RLS support | Possible but non-standard | Not practical |

For a B2B SaaS with hundreds to low-thousands of tenants, shared schema with RLS provides the best balance of isolation strength, operational simplicity, and cost efficiency.

---

## Tenant Hierarchy

Arbeidskassen models organizations using a three-level hierarchy:

```
Tenant (Company / Business Entity)
  └── Organization (Business Unit / Branch / Location)
       └── Department (Team / Functional Group)
```

### Definitions

| Level | Description | Example |
| --- | --- | --- |
| **Tenant** | The top-level billing entity. Owns the subscription and all data. One Stripe customer per tenant. | "Byggmester AS" |
| **Organization** | A logical sub-division within a tenant. Typically maps to a physical location or business unit. | "Oslo Branch", "Bergen Branch" |
| **Department** | A functional team within an organization. Used for scheduling, resource assignment, and access scoping. | "Elektro", "Rør", "Admin" |

### Why Three Levels

- **Small businesses** use only Tenant (Org and Department are optional defaults).
- **Mid-size businesses** add Organizations for multi-location management.
- **Enterprises** use all three levels for granular access control and reporting.

The hierarchy is **not recursive** — it is always exactly three levels. This avoids the performance and complexity pitfalls of closure tables or nested sets while covering the vast majority of real-world organizational structures.

---

## Schema Design

### Core Tables

```sql
-- Top-level: Tenants
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,       -- Used in URLs and subdomain routing
    plan        TEXT NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Level 2: Organizations
CREATE TABLE organizations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Level 3: Departments
CREATE TABLE departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User-Tenant membership (junction table)
CREATE TABLE tenant_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
    dept_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
    role        TEXT NOT NULL DEFAULT 'member',  -- 'owner', 'admin', 'member', 'viewer'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, user_id)
);
```

### Module Tables (Example: BookDet)

```sql
CREATE TABLE bookings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    org_id        UUID REFERENCES organizations(id) ON DELETE SET NULL,
    dept_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
    resource_id   UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    start_time    TIMESTAMPTZ NOT NULL,
    end_time      TIMESTAMPTZ NOT NULL,
    status        TEXT NOT NULL DEFAULT 'confirmed',
    created_by    UUID NOT NULL REFERENCES auth.users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,     -- 'room', 'vehicle', 'equipment', 'person'
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## The `tenant_id` Rule

> **Every table that contains tenant-scoped data MUST have a `tenant_id UUID NOT NULL` column with a foreign key to `tenants(id)`.**

This is the single most important rule in the database design. There are no exceptions for tenant-scoped data.

### Why `tenant_id` on Every Table (Not Just Top-Level)

Even though `bookings` → `resources` → `tenants` forms a chain, we still add `tenant_id` directly to `bookings`. Reasons:

1. **RLS simplicity** — policies only need to check `tenant_id = get_current_tenant_id()`. No joins required.
2. **Query performance** — `WHERE tenant_id = $1` can use a simple B-tree index. No recursive lookups.
3. **Safety** — if a foreign key is accidentally broken, `tenant_id` still prevents cross-tenant data leakage.
4. **Indexing** — composite indexes `(tenant_id, ...)` partition data logically, improving query plans.

### Index Strategy

```sql
-- Every tenant-scoped table gets this composite index
CREATE INDEX idx_bookings_tenant ON bookings (tenant_id, created_at DESC);
CREATE INDEX idx_resources_tenant ON resources (tenant_id, type);

-- The tenant_id column is always the leading column in composite indexes
-- This ensures the query planner can satisfy tenant-filtered queries efficiently
```

---

## Row Level Security (RLS)

RLS is the **primary isolation mechanism**. Every tenant-scoped table has RLS enabled with policies that restrict access to rows matching the user's tenant.

### How Tenant Context Is Resolved

1. The user authenticates via Supabase Auth (JWT).
2. The JWT contains the user's `sub` (user ID).
3. A helper function resolves the user's `tenant_id` from `tenant_members`:

```sql
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id
  FROM tenant_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

> **Note:** For users who belong to multiple tenants, tenant selection is stored in a session claim or a `current_tenant_id` field on the user's app_metadata. The function reads from that claim.

### Standard RLS Policy Template

```sql
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- SELECT: users can read their tenant's data
CREATE POLICY "tenant_select" ON bookings
    FOR SELECT USING (tenant_id = get_current_tenant_id());

-- INSERT: users can create within their tenant
CREATE POLICY "tenant_insert" ON bookings
    FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

-- UPDATE: users can update their tenant's data
CREATE POLICY "tenant_update" ON bookings
    FOR UPDATE USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- DELETE: users can delete their tenant's data
CREATE POLICY "tenant_delete" ON bookings
    FOR DELETE USING (tenant_id = get_current_tenant_id());
```

This identical pattern is applied to **every tenant-scoped table**. Module-specific policies (e.g., "only admins can delete resources") layer additional role checks on top.

See [SECURITY_AND_COMPLIANCE.md](./SECURITY_AND_COMPLIANCE.md) for the full security model including audit logging and cross-tenant collaboration.

---

## User-Tenant Relationship

A single Supabase Auth user can belong to **multiple tenants**. This enables consultants, accountants, and support staff to access multiple businesses without separate accounts.

```
auth.users (Supabase-managed)
    │
    ├── tenant_members (tenant_id=A, role='owner')
    ├── tenant_members (tenant_id=B, role='admin')
    └── tenant_members (tenant_id=C, role='viewer')
```

### Tenant Switching

- The active tenant is set via `app_metadata.current_tenant_id` on the JWT.
- Switching tenants updates this claim and refreshes the session.
- All RLS policies and `get_current_tenant_id()` read from this claim.

### Roles

| Role | Scope | Capabilities |
| --- | --- | --- |
| `owner` | Tenant | Full access. Manage billing, users, and all modules. One owner per tenant. |
| `admin` | Tenant | Manage users within their org/dept. Configure modules. |
| `member` | Org/Dept | Use modules within their assigned scope. |
| `viewer` | Org/Dept | Read-only access to assigned scope. |

Roles are enforced at two levels:
1. **RLS policies** — database-level enforcement (cannot be bypassed by application bugs).
2. **Server Actions** — application-level checks for UI/UX flow (e.g., hiding buttons, form validation).

---

## Query Patterns

### Fetching Data in a Server Component

```typescript
// app/bookings/page.tsx (Server Component)
import { createServerClient } from "@arbeidskassen/supabase/server";

export default async function BookingsPage() {
  const supabase = await createServerClient();

  // RLS automatically filters by tenant_id — no WHERE clause needed
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, resource:resources(name, type)")
    .order("start_time", { ascending: true });

  return <BookingsList bookings={bookings ?? []} />;
}
```

### Scoping by Organization or Department

```typescript
// When a user selects a specific organization in the UI
const { data: bookings } = await supabase
  .from("bookings")
  .select("*")
  .eq("org_id", selectedOrgId)       // Narrows within tenant
  .gte("start_time", startOfWeek);   // Additional filters
```

RLS still enforces `tenant_id`, so even if `selectedOrgId` belongs to a different tenant, zero rows are returned.

---

## Migration Guidelines

1. **All migrations live in `packages/supabase/supabase/migrations/`** and are managed by the Supabase CLI.
2. **Every new table with tenant data** must include `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
3. **Every new table with tenant data** must have RLS enabled and the four standard policies (select, insert, update, delete).
4. **Every migration is tested** against a local Supabase instance before deploying to staging.
5. **Destructive changes** (dropping columns, changing types) require a two-phase migration: add new → migrate data → drop old.

```bash
# Generate a new migration
cd packages/supabase
pnpm supabase migration new <migration_name>

# Apply locally
pnpm supabase db reset

# Generate updated TypeScript types
pnpm generate-types
```

---

## Trade-offs and Limits

| Concern | Mitigation |
| --- | --- |
| **Noisy neighbor** (one tenant's heavy queries slow others) | Supabase connection pooling + query timeouts. Future: read replicas for large tenants. |
| **Accidental cross-tenant access** | RLS is the primary defense. Application-level bugs cannot bypass database policies. Every query is filtered at the Postgres level. |
| **Schema evolution** | Single schema means one migration affects all tenants simultaneously. Tested in staging with representative data volumes before production deploy. |
| **Scale ceiling** | Single PostgreSQL instance scales to millions of rows per table with proper indexing. Beyond that: table partitioning by `tenant_id`, then read replicas. |
| **Tenant deletion** | `ON DELETE CASCADE` from `tenants(id)` propagates through all foreign keys. A soft-delete mechanism (`deleted_at`) is recommended for compliance and recovery. |
