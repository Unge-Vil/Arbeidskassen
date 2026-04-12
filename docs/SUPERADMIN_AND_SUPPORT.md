# Super Admin & Support Model

> How the platform owners administer tenants, manage system resources, and provide support — without ever silently accessing customer data.

---

## Table of Contents

- [Overview](#overview)
- [System Administration (Backoffice)](#system-administration-backoffice)
- [Strict Data Isolation (Zero Trust for Platform Owners)](#strict-data-isolation-zero-trust-for-platform-owners)
- [Consent-Based Support Access](#consent-based-support-access)
- [Backoffice App Architecture](#backoffice-app-architecture)
- [Security Boundaries](#security-boundaries)

---

## Overview

The Backoffice module (route group `(authenticated)/backoffice/`) is the **internal tool for platform owners** (the team that builds and operates Arbeidskassen). It shares authentication with the main app but is restricted to platform admin roles.

The core principle: **platform owners can manage the system but cannot read customer content.** This is not just a policy — it is enforced at the database level via RLS and dedicated service-role scoping.

---

## System Administration (Backoffice)

The backoffice provides operational capabilities across the platform without accessing tenant-specific content.

### Capabilities

| Capability | Data Accessed | Access Level |
| --- | --- | --- |
| **Tenant directory** | `tenants.id`, `name`, `slug`, `plan`, `plan_status`, `created_at` | Metadata only |
| **Subscription overview** | `tenants.stripe_customer_id`, `plan`, `plan_status`, `current_period_end` | Metadata only |
| **Credit management** | `ai_credits.balance`, `ai_credit_transactions` (aggregated) | Balance + totals, not individual usage context |
| **Manual credit grant** | Insert into `ai_credits` + `ai_credit_transactions` | Write (system action, heavily audited) |
| **Plan override** | Update `tenants.plan`, `tenants.plan_status` | Write (emergency use, heavily audited) |
| **Tenant health** | User count, last activity timestamp, error rates | Aggregated metrics only |
| **System metrics** | Total tenants, MRR, churn rate, API usage | Platform-wide aggregates |
| **Feature flags** | Global and per-tenant feature flag management | System configuration |
| **Support access grants** | `support_access_grants` table | Read active grants, cannot create them |

### Manual Credit Injection

The **only way** to add AI credits to any tenant without a successful Stripe transaction is through a manual credit grant in the Backoffice. This applies to all tenant types: paying customers, Demo Tenants, and support scenarios.

#### Process

1. **Platform admin navigates** to Backoffice → Tenants → [Tenant] → Credits.
2. **Enters amount and reason** — the reason field is mandatory (e.g., "Demo quota Q2 2026", "Compensation for outage #1234", "Sales demo top-up").
3. **System executes** an atomic `INSERT` into both `ai_credits` (increment balance) and `ai_credit_transactions` (audit entry with `type = 'manual_grant'`, `granted_by = admin.id`, `reason`).
4. **Platform audit log** records the action in `platform_audit_logs` with full details.
5. **Tenant visibility** — the credit appears in the tenant's credit history (visible in Organisasjon) with source labeled as "Platform grant".

#### Schema

```sql
-- Manual credit grant transaction (extends ai_credit_transactions)
-- type = 'manual_grant'
-- granted_by = platform_admin user_id
-- reason = mandatory text explaining the grant
-- All manual grants are visible in both:
--   1. platform_audit_logs (Backoffice visibility)
--   2. ai_credit_transactions (Tenant visibility via Organisasjon)
```

#### Guardrails

| Guardrail | Details |
| --- | --- |
| **Reason required** | The `reason` field is mandatory and must be non-empty. |
| **Max single grant** | A configurable maximum per single grant (default: 10 000 credits). Grants above this require `superadmin` role (not just `admin`). |
| **Daily limit** | A configurable daily total across all manual grants (default: 50 000 credits). Prevents accidental bulk granting. |
| **No negative grants** | Manual grants can only add credits, never subtract. Credit deductions happen only through `consumeCredits()`. |
| **Immutable audit trail** | Manual grant entries in `ai_credit_transactions` and `platform_audit_logs` cannot be edited or deleted. |

### What the Backoffice CANNOT Do

| Prohibited Action | Reason |
| --- | --- |
| Read bookings, resources, or customer details | Tenant content — GDPR protected |
| Read chat messages or file attachments | Tenant content — GDPR protected |
| Read tasks, projects, or time logs | Tenant content — GDPR protected |
| Read audit log *content* (`old_data`, `new_data`) | Contains tenant PII — only aggregated counts visible |
| Read user profiles beyond name and email | Minimized PII exposure |
| Impersonate a tenant user | Explicitly prohibited — see Consent-Based Support Access |
| Modify tenant organizational structure | Managed by tenant admin via Organisasjon |
| Access Supabase Storage (tenant files) | Tenant content — GDPR protected |

---

## Strict Data Isolation (Zero Trust for Platform Owners)

### Principle

> Even platform owners are untrusted actors with respect to customer data. The system is designed so that a compromised backoffice session cannot expose tenant content.

### How It's Enforced

#### 1. Dedicated Supabase Role

The backoffice uses a **dedicated PostgreSQL role** (`platform_admin`) with its own RLS policies that grant access only to system tables:

```sql
-- Create a dedicated role for backoffice operations
CREATE ROLE platform_admin;

-- Grant access ONLY to system/metadata columns
CREATE POLICY "platform_admin_read_tenants" ON tenants
    FOR SELECT TO platform_admin
    USING (true);  -- Can see all tenants (metadata only)

CREATE POLICY "platform_admin_read_credits" ON ai_credits
    FOR SELECT TO platform_admin
    USING (true);  -- Can see all credit balances

-- EXPLICITLY DENY access to content tables
-- No policies exist for platform_admin on:
--   bookings, resources, tasks, chat_messages, etc.
-- Therefore SELECT returns zero rows (RLS default-deny).
```

#### 2. Column-Level Restrictions

Even on tables the backoffice can read, sensitive columns are excluded at the application layer:

```typescript
// backoffice route group — tenant list query
// ONLY selects metadata columns, never content
const { data: tenants } = await supabase
  .from("tenants")
  .select("id, name, slug, plan, plan_status, created_at, current_period_end")
  .order("created_at", { ascending: false });

// NEVER:
// .select("*")  — would include branding/settings with PII
// .from("bookings")  — RLS blocks this entirely
```

#### 3. Separate Authentication

Backoffice users authenticate via a **separate authentication flow** that is not part of the tenant authentication system:

- Backoffice accounts are not in `tenant_members` — they exist in a `platform_admins` table.
- Backoffice sessions use a different JWT claim (`role: 'platform_admin'`) that RLS policies recognize.
- Multi-factor authentication (MFA) is **mandatory** for all backoffice accounts.

```sql
CREATE TABLE platform_admins (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL DEFAULT 'support',  -- 'support', 'admin', 'superadmin'
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only superadmins can manage other platform admins
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admins FORCE ROW LEVEL SECURITY;
```

#### 4. GDPR/DPA Compliance

| Requirement | Implementation |
| --- | --- |
| **Data Processing Agreement (DPA)** | Platform owners process tenant data as a Data Processor; tenants are Data Controllers |
| **Purpose limitation** | Backoffice access is strictly limited to system administration and support |
| **Data minimization** | Queries select only the columns needed; content columns are never fetched |
| **Access logging** | Every backoffice action is logged in `platform_audit_logs` (separate from tenant audit logs) |
| **Right to audit** | Tenants can request a report of all backoffice actions affecting their account |
| **Data portability** | Export functionality exists in the tenant's Organisasjon module, not in backoffice |

---

## Consent-Based Support Access

### No Silent Impersonation

Arbeidskassen does **not** implement a "Login as customer" or "impersonate user" feature. Such features:

- Violate the principle of least privilege.
- Create GDPR liability (accessing data without explicit consent).
- Undermine trust if discovered by the customer.
- Are difficult to audit comprehensively.

Instead, we use a **Consent-Based Support Access** model.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Tenant Admin Grants Access                         │
│                                                             │
│  In Organisasjon → Settings → Support Access:               │
│  "Grant Arbeidskassen support temporary access"             │
│  Duration: [24 hours ▾]                                     │
│  Scope: [Full read-only ▾] or [Specific module ▾]          │
│  [Grant Access]                                             │
│                                                             │
│  → Creates a time-limited entry in support_access_grants    │
│  → Notifies all tenant admins via email                     │
├─────────────────────────────────────────────────────────────┤
│  STEP 2: Support Agent Accesses Tenant                      │
│                                                             │
│  In Backoffice → Tenant → Support Session:                  │
│  "Active support grant: 23h remaining — Read-only"          │
│  [Enter Support Session]                                    │
│                                                             │
│  → RLS policies check support_access_grants                 │
│  → Support agent can READ data within granted scope         │
│  → Every query is logged with support agent identity        │
├─────────────────────────────────────────────────────────────┤
│  STEP 3: Grant Expires or Is Revoked                        │
│                                                             │
│  The grant auto-expires after the specified duration.       │
│  The Tenant Admin can revoke it early at any time.          │
│  Upon expiry: access is immediately cut off (RLS enforced). │
│                                                             │
│  → Tenant Admin receives "Support session ended" email      │
│  → Full support session log is available in Audit Logs      │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```sql
CREATE TABLE support_access_grants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- What access is granted
    scope           TEXT NOT NULL DEFAULT 'read_only',
    -- 'read_only' = read all tenant data
    -- 'module:bookdet' = read only BookDet data
    -- 'module:today' = read only Today data

    -- Time boundaries
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,           -- NULL = still active (or expired naturally)

    -- Who granted and who is using it
    granted_by      UUID NOT NULL REFERENCES auth.users(id),  -- Tenant admin
    support_agent   UUID REFERENCES auth.users(id),           -- Set when support enters session

    -- Audit
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Prevent overlapping grants
    CONSTRAINT valid_expiry CHECK (expires_at > granted_at),
    CONSTRAINT max_duration CHECK (expires_at <= granted_at + INTERVAL '72 hours')
);

-- Index for checking active grants
CREATE INDEX idx_support_grants_active
    ON support_access_grants (tenant_id, expires_at DESC)
    WHERE revoked_at IS NULL;
```

### RLS Policy for Support Access

```sql
-- Support agents can read tenant data ONLY when an active grant exists
CREATE POLICY "support_read_bookings" ON bookings
    FOR SELECT USING (
        -- Normal tenant access
        tenant_id = get_current_tenant_id()
        OR
        -- Support access (time-limited, consent-based)
        EXISTS (
            SELECT 1 FROM support_access_grants sag
            WHERE sag.tenant_id = bookings.tenant_id
              AND sag.support_agent = auth.uid()
              AND sag.expires_at > now()
              AND sag.revoked_at IS NULL
              AND (sag.scope = 'read_only' OR sag.scope = 'module:bookdet')
        )
    );
```

This policy pattern is replicated on every content table. Support agents can **never** INSERT, UPDATE, or DELETE tenant data — grants are strictly read-only.

### Support Session Audit Trail

Every action taken during a support session is logged in the **tenant's own audit log** (not the platform audit log), ensuring the tenant has full visibility:

```sql
CREATE TABLE support_session_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    grant_id        UUID NOT NULL REFERENCES support_access_grants(id) ON DELETE CASCADE,
    support_agent   UUID NOT NULL REFERENCES auth.users(id),
    action          TEXT NOT NULL,          -- 'query', 'view_record', 'export'
    table_name      TEXT NOT NULL,
    record_id       UUID,
    query_summary   TEXT,                   -- Human-readable description
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenants can see all support activity
ALTER TABLE support_session_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_read_support_logs" ON support_session_logs
    FOR SELECT USING (tenant_id = get_current_tenant_id());
```

### Grant Duration Limits

| Support Tier | Max Duration | Auto-Renewal |
| --- | --- | --- |
| Standard | 24 hours | No — new grant required |
| Extended (with justification noted) | 72 hours | No — hard maximum |
| Write access | **Not available** | — |

---

## Backoffice Route Architecture (Target)

> **Note:** The backoffice is currently a minimal dashboard page at `(authenticated)/backoffice/page.tsx`. The route structure below is the target architecture.

```
apps/arbeidskassen/app/[locale]/(authenticated)/backoffice/
├── page.tsx                     # System overview (tenant count, MRR, health)
├── tenants/                     # Tenant directory (metadata only)
│   ├── page.tsx                 # List all tenants
│   └── [id]/
│       ├── page.tsx             # Tenant detail (plan, credits, status)
│       └── support/
│           └── page.tsx         # Active support grants, session entry
├── credits/                     # Global credit management
│   └── page.tsx                 # Grant credits, view platform-wide usage
├── billing/                     # Stripe global view
│   └── page.tsx                 # Failed payments, MRR dashboard
├── features/                    # Feature flag management
│   └── page.tsx
└── logs/                        # Platform audit logs (backoffice actions only)
    └── page.tsx
```

---

## Security Boundaries

### Summary of Access Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                          Data Layer                              │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Data Type   │ Tenant User  │ Backoffice   │ Support (with      │
│              │              │ (no grant)   │ active grant)      │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Tenant       │ Own tenant   │ All tenants  │ Granted tenant     │
│ metadata     │ only         │ (metadata)   │ (metadata)         │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Org          │ Own tenant   │ ✗ BLOCKED    │ READ only          │
│ hierarchy    │ only         │              │ (if in scope)      │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ User         │ Own tenant   │ Name + email │ READ only          │
│ profiles     │ only         │ only         │ (if in scope)      │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Bookings,    │ Own tenant   │ ✗ BLOCKED    │ READ only          │
│ resources    │ only (RLS)   │              │ (if BookDet scope) │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Tasks,       │ Own tenant   │ ✗ BLOCKED    │ READ only          │
│ projects     │ only (RLS)   │              │ (if Today scope)   │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Chat         │ Own tenant   │ ✗ BLOCKED    │ READ only          │
│ messages     │ only (RLS)   │              │ (if in scope)      │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ AI credit    │ Own tenant   │ All tenants  │ Granted tenant     │
│ balance      │ balance      │ (balances)   │ (balance)          │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Audit logs   │ Own tenant   │ ✗ BLOCKED    │ READ only          │
│ (content)    │ (full)       │              │ (if in scope)      │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Audit logs   │ N/A          │ Counts only  │ Counts only        │
│ (aggregated) │              │              │                    │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ Write/mutate │ Own tenant   │ Credits +    │ ✗ NEVER            │
│ operations   │ (RLS)        │ plan only    │ (read-only always) │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

### Platform Audit Log (Backoffice Actions)

All backoffice actions are logged separately from tenant audit logs:

```sql
CREATE TABLE platform_audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID NOT NULL REFERENCES auth.users(id),    -- Backoffice user
    action      TEXT NOT NULL,              -- 'grant_credits', 'override_plan', 'enter_support_session'
    target_type TEXT NOT NULL,              -- 'tenant', 'credit', 'feature_flag'
    target_id   UUID,
    details     JSONB NOT NULL DEFAULT '{}',
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

This log is reviewed regularly and is available to tenants upon request as part of GDPR data processor transparency obligations.
