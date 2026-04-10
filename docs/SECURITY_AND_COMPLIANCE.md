# Security & Compliance

> Arbeidskassen's Zero Trust security architecture — enforced at the database level, verified at the application level, and audited continuously.

---

## Table of Contents

- [Zero Trust Principles](#zero-trust-principles)
- [Defense in Depth](#defense-in-depth)
- [Row Level Security (RLS) — The Primary Defense](#row-level-security-rls--the-primary-defense)
- [Server-Side Validation](#server-side-validation)
- [Authentication](#authentication)
- [Audit Logging](#audit-logging)
- [Cross-Tenant Collaboration (ACL)](#cross-tenant-collaboration-acl)
- [Data Protection](#data-protection)
- [Incident Response](#incident-response)

---

## Zero Trust Principles

Arbeidskassen follows a Zero Trust architecture. **No request is trusted by default**, regardless of whether it originates from inside the application, an authenticated user, or a Server Action.

### Core Tenets

1. **Never trust, always verify** — Every data access is authenticated and authorized at the database level via RLS. Application-level checks are a secondary defense, not the primary one.
2. **Least privilege** — Users receive the minimum role required. Database connections use the `anon` or `authenticated` role, never `service_role`, except in explicitly audited admin operations.
3. **Assume breach** — The architecture is designed so that even if the application layer is compromised, RLS prevents cross-tenant data access. Audit logs capture every significant action for forensic analysis.
4. **Verify explicitly** — Every Server Action re-authenticates the user, re-validates input, and re-checks authorization. Session state is never trusted as a sole source of truth.

---

## Defense in Depth

Security is enforced at multiple layers. Each layer operates independently — a failure in one layer does not compromise the others.

```
┌──────────────────────────────────────────────────────┐
│  Layer 1: Edge / CDN (Vercel / Cloudflare)           │
│  - DDoS protection                                   │
│  - Rate limiting                                     │
│  - Bot detection                                     │
│  - TLS termination                                   │
├──────────────────────────────────────────────────────┤
│  Layer 2: Next.js Middleware                         │
│  - Session validation                                │
│  - Route protection (redirect unauthenticated)       │
│  - Tenant context resolution                         │
├──────────────────────────────────────────────────────┤
│  Layer 3: Server Actions / API Routes                │
│  - Re-authenticate user (getUser())                  │
│  - Input validation (Zod schemas)                    │
│  - Role / permission checks                          │
│  - Business logic authorization                      │
├──────────────────────────────────────────────────────┤
│  Layer 4: Supabase RLS (PostgreSQL)         ← PRIMARY│
│  - Row Level Security policies                       │
│  - tenant_id enforcement on every query              │
│  - Role-based access within tenant                   │
│  - Foreign key constraints                           │
├──────────────────────────────────────────────────────┤
│  Layer 5: Audit & Monitoring                         │
│  - Postgres triggers log all mutations               │
│  - Anomaly detection on access patterns              │
│  - Alerting on policy violations                     │
└──────────────────────────────────────────────────────┘
```

**Layer 4 (RLS) is the primary defense.** Even if Layers 2 and 3 are bypassed entirely (e.g., a developer accidentally exposes a direct Supabase query without auth checks), RLS still prevents unauthorized data access.

---

## Row Level Security (RLS) — The Primary Defense

Every tenant-scoped table has RLS enabled. Policies are the **final authority** on data access.

### Policy Design

RLS policies follow a strict, repeatable pattern:

```sql
-- Standard four-policy template for every tenant-scoped table
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (prevents accidental bypass)
ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON <table_name>
    FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_insert" ON <table_name>
    FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_update" ON <table_name>
    FOR UPDATE USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "tenant_delete" ON <table_name>
    FOR DELETE USING (tenant_id = get_current_tenant_id());
```

### Role-Based Policies (Layered)

Module-specific tables add role checks on top of tenant isolation:

```sql
-- Only admins and owners can delete resources
CREATE POLICY "admin_delete_resources" ON resources
    FOR DELETE USING (
        tenant_id = get_current_tenant_id()
        AND get_current_user_role() IN ('owner', 'admin')
    );

-- Members can only update their own bookings
CREATE POLICY "member_update_own_bookings" ON bookings
    FOR UPDATE USING (
        tenant_id = get_current_tenant_id()
        AND (
            created_by = auth.uid()
            OR get_current_user_role() IN ('owner', 'admin')
        )
    );
```

### RLS Verification Checklist

Before any migration is deployed:

- [ ] Table has `ENABLE ROW LEVEL SECURITY`
- [ ] Table has `FORCE ROW LEVEL SECURITY`
- [ ] All four CRUD policies exist
- [ ] Policies reference `get_current_tenant_id()`, not hardcoded values
- [ ] No policy uses `USING (true)` (would grant universal access)
- [ ] Tested: unauthenticated request returns zero rows
- [ ] Tested: user from Tenant A cannot read Tenant B's data

---

## Server-Side Validation

**All input validation occurs on the server.** Client-side validation exists only for UX (immediate feedback) — it is never relied upon for security.

### Validation Rules

1. **Every Server Action validates input with Zod** before any database operation.
2. **Type coercion is explicit** — `FormData` values are strings; they must be parsed and validated.
3. **No raw SQL** — all queries go through the Supabase client, which uses parameterized queries (preventing SQL injection).
4. **File uploads** are validated for type, size, and content (not just file extension).

### Example: Complete Server Action Validation

```typescript
"use server";

import { z } from "zod";
import { createServerClient } from "@arbeidskassen/supabase/server";

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(254),
  phone: z.string().regex(/^\+?[0-9\s-]{7,15}$/).optional().or(z.literal("")),
});

export async function updateProfile(formData: FormData) {
  // 1. Authenticate — ALWAYS first
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Authentication required" };
  }

  // 2. Validate — NEVER trust input
  const result = UpdateProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!result.success) {
    return { error: "Invalid input", details: result.error.flatten() };
  }

  // 3. Authorize — check role if needed
  // (RLS handles tenant isolation, but business rules may require role checks)

  // 4. Mutate — RLS enforces tenant isolation
  const { error } = await supabase
    .from("profiles")
    .update(result.data)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update profile" };
  }

  return { success: true };
}
```

---

## Authentication

Arbeidskassen uses **Supabase Auth** as the sole authentication provider.

### Auth Flow

1. User submits credentials (email/password, magic link, or OAuth).
2. Supabase Auth issues a JWT with the user's `sub` (user ID) and custom claims.
3. The JWT is stored in an HTTP-only, Secure, SameSite=Lax cookie via `@supabase/ssr`.
4. Every Server Component and Server Action creates a Supabase client from the cookie, which attaches the JWT to all database queries.
5. RLS policies read `auth.uid()` from the JWT to resolve tenant membership.

### Session Security

| Control | Implementation |
| --- | --- |
| **Token storage** | HTTP-only cookies (not `localStorage`) |
| **Token refresh** | Middleware refreshes tokens before expiry |
| **CSRF protection** | SameSite=Lax cookies + Server Actions (POST-only, Origin-checked by Next.js) |
| **Session invalidation** | Supabase `auth.signOut()` clears all sessions server-side |

### Middleware

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Refresh the session (extends token lifetime)
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
```

---

## Audit Logging

Every significant data mutation is recorded in an immutable audit log using PostgreSQL triggers. This provides a forensic trail for compliance, debugging, and anomaly detection.

### Audit Log Table

```sql
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_name  TEXT NOT NULL,
    record_id   UUID NOT NULL,
    action      TEXT NOT NULL,          -- 'INSERT', 'UPDATE', 'DELETE'
    old_data    JSONB,                  -- Previous state (NULL for INSERT)
    new_data    JSONB,                  -- New state (NULL for DELETE)
    changed_by  UUID REFERENCES auth.users(id),
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by tenant and time range
CREATE INDEX idx_audit_logs_tenant_time
    ON audit_logs (tenant_id, created_at DESC);

-- Index for querying by record
CREATE INDEX idx_audit_logs_record
    ON audit_logs (table_name, record_id, created_at DESC);
```

### Trigger Function

```sql
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (tenant_id, table_name, record_id, action, new_data, changed_by)
        VALUES (NEW.tenant_id, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (tenant_id, table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (NEW.tenant_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (tenant_id, table_name, record_id, action, old_data, changed_by)
        VALUES (OLD.tenant_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Attaching the Trigger

```sql
-- Apply to every tenant-scoped table
CREATE TRIGGER audit_bookings
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_resources
    AFTER INSERT OR UPDATE OR DELETE ON resources
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Repeat for each tenant-scoped table...
```

### Audit Log Security

- The `audit_logs` table has RLS enabled — tenants can only read their own audit logs.
- The trigger function uses `SECURITY DEFINER` so it can write audit logs even when the user's role would not directly permit inserts to `audit_logs`.
- Audit logs are **append-only** — no UPDATE or DELETE policies exist for non-admin roles. Historical records cannot be tampered with through the application.

### Audit Log Presentation (Organisasjon Module)

While PostgreSQL triggers capture audit data at the database level across all modules (bookings, resources, tasks, etc.), the **Organisasjon module is the sole provider of the audit log UI**. No feature module builds its own audit viewer.

- **Centralized query interface** — Organisasjon provides a paginated, filterable audit log page that queries the `audit_logs` table with tenant-scoped RLS.
- **Cross-module visibility** — A single view shows mutations from BookDet (bookings, resources), Today (tasks, shifts), and Organisasjon itself (user changes, setting updates, billing events).
- **Module-aware filtering** — The UI maps `table_name` values to human-readable module labels (e.g., `bookings` → "BookDet", `tenant_members` → "Organisasjon").
- **Diff visualization** — UPDATE actions display a side-by-side diff of `old_data` vs `new_data` JSONB fields, highlighting changed fields.
- **Deep-link support** — Feature modules link to the audit viewer with query parameters (`?table=bookings&record_id=<id>`) for contextual "View history" buttons. These links are resolved and rendered within Organisasjon.
- **Export for compliance** — CSV and JSON export for external auditors, filtered by date range, module, or user.
- **Retention management** — Configurable per-tenant retention policies with automated cleanup (default: 2 years).

See [docs/CORE_ORGANIZATION_MODULE.md](./CORE_ORGANIZATION_MODULE.md#global-audit-logs) for the full audit log viewer specification and screen mockups.

---

## Cross-Tenant Collaboration (ACL)

Some scenarios require controlled data sharing between tenants — for example, a consultant accessing a client's booking data, or two businesses coordinating shared resources.

### ACL Table Design

```sql
CREATE TABLE cross_tenant_acl (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The tenant granting access
    grantor_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    -- The tenant receiving access
    grantee_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    -- Optionally, a specific user in the grantee tenant
    grantee_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    -- What resource type is being shared
    resource_type   TEXT NOT NULL,       -- 'bookings', 'resources', 'reports'
    -- What level of access
    permission      TEXT NOT NULL,       -- 'read', 'write', 'admin'
    -- Optional: restrict to specific records
    resource_id     UUID,               -- NULL = all resources of this type
    -- Validity
    expires_at      TIMESTAMPTZ,        -- NULL = no expiry
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID NOT NULL REFERENCES auth.users(id),

    -- Prevent duplicate grants
    UNIQUE(grantor_tenant_id, grantee_tenant_id, grantee_user_id, resource_type, resource_id)
);

-- A tenant cannot grant access to itself
ALTER TABLE cross_tenant_acl
    ADD CONSTRAINT no_self_grant
    CHECK (grantor_tenant_id != grantee_tenant_id);
```

### RLS Policy with ACL Support

Cross-tenant policies extend the standard tenant isolation:

```sql
-- Extended SELECT policy: own tenant OR granted via ACL
CREATE POLICY "tenant_or_acl_select" ON bookings
    FOR SELECT USING (
        tenant_id = get_current_tenant_id()
        OR EXISTS (
            SELECT 1 FROM cross_tenant_acl acl
            WHERE acl.grantor_tenant_id = bookings.tenant_id
              AND acl.grantee_tenant_id = get_current_tenant_id()
              AND acl.resource_type = 'bookings'
              AND acl.permission IN ('read', 'write', 'admin')
              AND (acl.resource_id IS NULL OR acl.resource_id = bookings.id)
              AND (acl.grantee_user_id IS NULL OR acl.grantee_user_id = auth.uid())
              AND (acl.expires_at IS NULL OR acl.expires_at > now())
        )
    );
```

### ACL Rules

1. **Only tenant owners and admins can create ACL entries** (enforced in Server Actions and RLS).
2. **ACL grants are always visible to both tenants** — the grantor can revoke, the grantee can see what they have access to.
3. **Expiring grants** — ACL entries can have an `expires_at` timestamp for temporary access (e.g., project-based collaboration).
4. **Audit trail** — ACL creation, modification, and deletion are captured in `audit_logs`.

---

## Data Protection

| Control | Implementation |
| --- | --- |
| **Encryption at rest** | Supabase encrypts all data at rest (AES-256) |
| **Encryption in transit** | TLS 1.2+ enforced for all connections |
| **Secrets management** | Environment variables via Vercel/Cloudflare; never committed to source |
| **PII handling** | Personal data is stored only in `profiles` and `tenant_members`; minimized where possible |
| **Data retention** | Configurable per tenant; soft-delete with `deleted_at` before hard purge |
| **Backup** | Supabase automated daily backups; point-in-time recovery on Pro plan |

---

## Incident Response

### If a Cross-Tenant Data Leak Is Suspected

1. **Immediately** check `audit_logs` for the affected table and time range.
2. **Review** RLS policies on the affected table — ensure `FORCE ROW LEVEL SECURITY` is active.
3. **Check** for any `service_role` usage in application code (should be extremely limited).
4. **Verify** the `get_current_tenant_id()` function returns the correct value for the affected user.
5. **Revoke** any suspicious ACL entries in `cross_tenant_acl`.
6. **Notify** affected tenants per the data processing agreement.

### Security Testing Checklist

- [ ] RLS policies prevent unauthenticated access (test with `anon` role)
- [ ] RLS policies prevent cross-tenant access (test with user from different tenant)
- [ ] Server Actions reject invalid input (fuzz with malformed `FormData`)
- [ ] Server Actions reject unauthenticated requests
- [ ] Audit logs capture all mutations
- [ ] ACL entries cannot grant access to non-existent tenants
- [ ] ACL expiry is enforced (test with expired grants)
- [ ] No `service_role` key is exposed to the client
