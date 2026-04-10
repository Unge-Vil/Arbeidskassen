# Core Module: Organisasjon (Organization)

> The foundational system module that establishes organizational identity, hierarchy, and user governance across the entire Arbeidskassen ecosystem.

---

## Table of Contents

- [Purpose](#purpose)
- [Why a Dedicated Module](#why-a-dedicated-module)
- [Domain Model](#domain-model)
- [Core Capabilities](#core-capabilities)
- [Billing & Subscriptions](#billing--subscriptions)
- [Credit Management](#credit-management)
- [Global Audit Logs](#global-audit-logs)
- [Relationship to Feature Modules](#relationship-to-feature-modules)
- [Data Ownership Boundaries](#data-ownership-boundaries)
- [Key Screens](#key-screens)
- [Access Control Model](#access-control-model)

---

## Purpose

The Organisasjon module is the **Source of Truth** for everything that defines *who* a tenant is, *how* they are structured, and *who* can do *what* across the platform. It is included in every subscription tier — there is no Arbeidskassen deployment without it.

While feature modules (BookDet, Today, etc.) manage domain-specific resources like bookings or tasks, they all depend on Organisasjon for:

- **Identity** — the tenant's legal name, organization number, branding, and contact details.
- **Structure** — the hierarchy of organizations, departments, and sub-departments.
- **People** — the user directory, role assignments, and cross-module access control.
- **Settings** — global preferences (locale, timezone, fiscal year, working hours) that all modules inherit.
- **Billing** — centralized Stripe subscription management, invoicing, and payment method administration.
- **Credits** — AI credit balance tracking, usage analytics, and credit pack purchasing.
- **Audit** — a unified audit log viewer that surfaces every significant action across all modules.

Without Organisasjon, no other module can resolve who the current user is, what they are allowed to do, or which organizational unit they belong to.

---

## Why a Dedicated Module

In many SaaS platforms, organizational settings are buried inside a "Settings" page of the main admin panel. Arbeidskassen promotes this to a first-class module for three reasons:

1. **Complexity at scale** — A construction firm with 5 branches and 20 departments needs dedicated tooling to manage its structure. A settings page is not sufficient.
2. **Separation of concerns** — Tenant admins who manage people and structure should not need to navigate booking calendars or task boards. The Organisasjon module gives them a focused workspace.
3. **API boundary** — By isolating organizational data in a dedicated module with clear data contracts, feature modules consume the hierarchy via well-defined queries rather than reaching into shared state.

---

## Domain Model

```
Tenant (root entity — one per paying customer)
│
├── Metadata
│   ├── Legal name, display name
│   ├── Organization number (Org.nr / Foretaksnummer)
│   ├── Address (physical, postal, delivery)
│   ├── Contact information (phone, email, website)
│   ├── Branding (logo URL, primary color override)
│   └── Settings (locale, timezone, fiscal year start, default working hours)
│
├── Billing
│   ├── Stripe customer ID, subscription ID
│   ├── Current plan (free, starter, professional, enterprise)
│   ├── Billing method (stripe / ehf)
│   ├── Payment history
│   └── EHF details (org number, PEPPOL address)
│
├── AI Credits
│   ├── Current balance
│   └── Transaction history (purchases, usage, refunds)
│
├── Organizations (business units / branches / locations)
│   ├── Name, address, contact
│   ├── Cost center / accounting reference
│   └── Departments
│       ├── Name, description
│       ├── Manager (user reference)
│       └── Sub-departments (optional, one level deep)
│           ├── Name, description
│           └── Manager (user reference)
│
└── Members (users belonging to this tenant)
    ├── User identity (links to auth.users)
    ├── Global role (owner, admin, member, viewer)
    ├── Organization assignment
    ├── Department assignment
    └── Module-specific role overrides (optional)
```

### Sub-Departments

The hierarchy documented in [DATABASE_MULTI_TENANT.md](./DATABASE_MULTI_TENANT.md) defines three levels: Tenant → Organization → Department. Organisasjon extends this with an optional **sub-department** level for larger organizations that need finer grouping (e.g., "Elektro" → "Sterkstrøm" / "Svakstrøm").

```sql
CREATE TABLE sub_departments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dept_id     UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    manager_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: standard tenant isolation
ALTER TABLE sub_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_departments FORCE ROW LEVEL SECURITY;
```

Sub-departments are **optional** and **limited to one nesting level**. The hierarchy is never recursive — it is always Tenant → Organization → Department → Sub-department (max 4 levels).

---

## Core Capabilities

### 1. Tenant Metadata Management

The tenant admin configures the business identity that appears across all modules:

| Setting | Used By | Example |
| --- | --- | --- |
| Legal name | Invoices (EHF), contracts, audit logs | "Byggmester Hansen AS" |
| Organization number | EHF invoicing, public records lookup | "923 456 789" |
| Display name | UI headers, booking pages, emails | "Hansen Bygg" |
| Logo / branding | BookDet public pages, email templates, PDF exports | Logo URL + primary color hex |
| Default locale | All modules (date/number formatting) | `no` (Norwegian Bokmål) |
| Default timezone | BookDet availability, Today scheduling | `Europe/Oslo` |
| Fiscal year start | Reporting, billing cycles | January (default) or custom month |
| Working hours | BookDet availability defaults, Today shift planning | Mon–Fri 07:00–15:30 |

### 2. Hierarchy Management (Org → Dept → Sub-dept)

A visual tree editor for managing the organizational structure:

- **Create / rename / archive** organizations, departments, and sub-departments.
- **Reassign** users when restructuring (merge departments, move teams between orgs).
- **Bulk operations** — import structure from CSV, duplicate an org's department template.
- **Soft delete** — archived entities are hidden from selectors but preserved for historical reporting.

### 3. User Management

The central user directory for the tenant:

| Capability | Description |
| --- | --- |
| **Invite** | Send email invitations. New users join via Supabase Auth magic link or OAuth. |
| **Assign** | Place users in an organization → department → sub-department. |
| **Role assignment** | Set global role (owner, admin, member, viewer) and optional module-specific overrides. |
| **Deactivate** | Disable access without deleting the user (preserves audit history). |
| **Multi-tenant** | A single person can belong to multiple tenants. Organisasjon manages the membership for *this* tenant. |
| **Activity log** | View a user's recent actions across all modules (sourced from `audit_logs`). |

### 4. Global Settings & Defaults

Settings configured here cascade to all feature modules as defaults. Modules may allow local overrides (e.g., a specific BookDet resource can have different working hours), but the global values are always the fallback.

```typescript
// Any module can read global settings via a shared helper
import { createServerClient } from "@arbeidskassen/supabase/server";

export async function getTenantSettings() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tenants")
    .select("locale, timezone, working_hours, fiscal_year_start")
    .single();
  return data;
}
```

---

## Billing & Subscriptions

Organisasjon is the **single point of control** for all billing operations. No other module creates Stripe Checkout sessions, manages subscriptions, or processes payment webhooks.

### Stripe Integration

| Operation | Implementation | Access ||
| --- | --- | --- |
| View current plan | Read `tenants.plan` + Stripe Subscription API | owner, admin |
| Upgrade / downgrade | Create Stripe Checkout Session / Billing Portal | owner only |
| Update payment method | Stripe Customer Portal redirect | owner only |
| View invoice history | Query Stripe Invoices API | owner, admin |
| Switch to EHF billing | Update `tenants.billing_method`, store org number | owner only |

### Webhook Handler

All Stripe webhooks are processed by a single endpoint in the Organisasjon app:

```
apps/organisasjon/app/api/webhooks/stripe/route.ts
```

This handler is the **only place** in the codebase that uses the `service_role` key (see [SECURITY_AND_COMPLIANCE.md](./SECURITY_AND_COMPLIANCE.md)). It processes the following events:

| Stripe Event | Action |
| --- | --- |
| `checkout.session.completed` | Provision module access, update `tenants.plan` |
| `customer.subscription.updated` | Sync plan changes (upgrade/downgrade) |
| `customer.subscription.deleted` | Revoke module access, set plan to `free` |
| `invoice.payment_succeeded` | Record payment, update billing status |
| `invoice.payment_failed` | Flag tenant, send dunning notification |

### Subscription State in Database

```sql
-- Billing fields on the tenants table (managed exclusively by Organisasjon)
ALTER TABLE tenants ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE tenants ADD COLUMN plan_status TEXT NOT NULL DEFAULT 'active';
-- 'active', 'trialing', 'past_due', 'canceled', 'unpaid'

ALTER TABLE tenants ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN current_period_end TIMESTAMPTZ;
```

Feature modules check subscription state to gate features:

```typescript
// Any module can check if a feature is available
import { createServerClient } from "@arbeidskassen/supabase/server";

export async function hasModuleAccess(module: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("tenants")
    .select("plan, plan_status")
    .single();

  if (!data || data.plan_status === "canceled") return false;

  const moduleAccess: Record<string, string[]> = {
    bookdet: ["starter", "professional", "enterprise"],
    today: ["starter", "professional", "enterprise"],
    ai: ["professional", "enterprise"],
  };

  return moduleAccess[module]?.includes(data.plan) ?? false;
}
```

---

## Credit Management

AI credit balance and usage tracking is centralized in Organisasjon. Feature modules consume credits but never manage balances directly.

### Data Model

The credit tables (defined in [PRODUCT_VISION_AND_BUSINESS_LOGIC.md](./PRODUCT_VISION_AND_BUSINESS_LOGIC.md)) are owned and managed by Organisasjon:

```sql
-- Balance table: one row per tenant
CREATE TABLE ai_credits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    balance     INTEGER NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transaction ledger: immutable log of all credit changes
CREATE TABLE ai_credit_transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount      INTEGER NOT NULL,            -- Positive = purchase/refund, negative = usage
    reason      TEXT NOT NULL,               -- 'purchase', 'estimate', 'chat', 'summarize', 'refund'
    reference_id UUID,                       -- Stripe payment ID or AI request ID
    created_by  UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Credit Operations (Managed by Organisasjon)

| Operation | Who | How |
| --- | --- | --- |
| **Purchase credits** | Owner / Admin | Stripe Checkout → webhook updates `ai_credits.balance` |
| **View balance** | Any authenticated user | Read `ai_credits.balance` (displayed in header/dashboard) |
| **View usage history** | Owner / Admin | Query `ai_credit_transactions` with filters (date, reason, user) |
| **Usage analytics** | Owner / Admin | Aggregated views: credits by module, by user, by time period |
| **Low balance alert** | System | Trigger notification when balance drops below configurable threshold |

### Credit Consumption (By Feature Modules)

Feature modules consume credits via a shared Server Action provided by the Supabase package:

```typescript
// packages/supabase/src/credits.ts
import { createServerClient } from "./server";

export async function consumeCredits(
  amount: number,
  reason: string,
  referenceId?: string,
): Promise<{ success: boolean; remainingBalance?: number; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Check balance
  const { data: credits } = await supabase
    .from("ai_credits")
    .select("balance")
    .single();

  if (!credits || credits.balance < amount) {
    return { success: false, error: "Insufficient credits" };
  }

  // Deduct atomically
  const { data, error } = await supabase.rpc("deduct_credits", {
    p_amount: amount,
    p_reason: reason,
    p_reference_id: referenceId,
    p_user_id: user.id,
  });

  if (error) return { success: false, error: "Credit deduction failed" };
  return { success: true, remainingBalance: data };
}
```

```sql
-- Atomic credit deduction (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_credits(
    p_amount INTEGER,
    p_reason TEXT,
    p_reference_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_tenant_id UUID;
    v_new_balance INTEGER;
BEGIN
    SELECT get_current_tenant_id() INTO v_tenant_id;

    UPDATE ai_credits
    SET balance = balance - p_amount, updated_at = now()
    WHERE tenant_id = v_tenant_id AND balance >= p_amount
    RETURNING balance INTO v_new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient credit balance';
    END IF;

    INSERT INTO ai_credit_transactions (tenant_id, amount, reason, reference_id, created_by)
    VALUES (v_tenant_id, -p_amount, p_reason, p_reference_id, p_user_id);

    RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Usage Analytics Dashboard

Organisasjon provides a dedicated analytics page showing:

- **Burn rate** — average daily credit consumption over the last 30 days
- **Projected depletion** — estimated date when credits will run out at current rate
- **Usage by module** — pie chart (BookDet AI estimates vs Today AI scheduling vs Chat)
- **Usage by user** — table sorted by consumption, useful for identifying heavy users
- **Purchase history** — linked to Stripe receipts

---

## Global Audit Logs

Organisasjon provides the **master audit log viewer** — a centralized UI for querying the `audit_logs` table that collects mutations from every module in the ecosystem.

### How It Works

Individual feature modules do not build their own audit log UIs. Instead:

1. **PostgreSQL triggers** on every tenant-scoped table write audit entries into the shared `audit_logs` table (see [SECURITY_AND_COMPLIANCE.md](./SECURITY_AND_COMPLIANCE.md) for the trigger implementation).
2. **Organisasjon** provides the only UI for querying, filtering, and exporting these logs.
3. Feature modules may link to the audit log viewer with pre-applied filters (e.g., "View audit trail for this booking" deep-links to Organisasjon with `?table=bookings&record_id=<id>`).

### Audit Log Viewer Capabilities

| Capability | Description |
| --- | --- |
| **Global search** | Full-text search across `old_data` and `new_data` JSONB fields |
| **Filter by module** | Filter `table_name` by module prefix (e.g., `bookings`, `resources` → BookDet) |
| **Filter by user** | Show actions by a specific user (joins with user directory) |
| **Filter by action** | INSERT, UPDATE, DELETE |
| **Filter by date range** | Time-bounded queries with `created_at` index |
| **Filter by org/dept** | Cross-reference `record_id` with org/dept hierarchy |
| **Diff view** | Side-by-side comparison of `old_data` vs `new_data` for UPDATE actions |
| **Export** | CSV/JSON export for compliance reporting |
| **Retention policy** | Configurable per tenant (default: 2 years, enterprise: unlimited) |

### Audit Log Screen

```
┌─────────────────────────────────────────────────────────────┐
│  Organisasjon  ▸  Revisjonslogg                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Filtre: [Alle moduler ▾] [Alle brukere ▾] [Siste 7 dager ▾]│
│  Søk: [________________________]  [Eksporter CSV]          │
│                                                             │
│  ┌─────────┬──────────┬────────┬───────────┬──────────────┐ │
│  │ Tid     │ Bruker   │ Modul  │ Handling  │ Detaljer     │ │
│  ├─────────┼──────────┼────────┼───────────┼──────────────┤ │
│  │ 14:32   │ Kari N.  │BookDet │ UPDATE    │ Booking #452 │ │
│  │         │          │        │           │ status →     │ │
│  │         │          │        │           │ confirmed    │ │
│  ├─────────┼──────────┼────────┼───────────┼──────────────┤ │
│  │ 14:28   │ Per O.   │ Org    │ INSERT    │ New user     │ │
│  │         │          │        │           │ invited:     │ │
│  │         │          │        │           │ lars@...     │ │
│  ├─────────┼──────────┼────────┼───────────┼──────────────┤ │
│  │ 13:55   │ System   │ Billing│ UPDATE    │ Plan changed │ │
│  │         │          │        │           │ starter →    │ │
│  │         │          │        │           │ professional │ │
│  └─────────┴──────────┴────────┴───────────┴──────────────┘ │
│                                                             │
│  Viser 1–25 av 1,247 hendelser       [◀ Forrige] [Neste ▶] │
└─────────────────────────────────────────────────────────────┘
```

### Deep-Linking from Feature Modules

Feature modules can link to the audit log with pre-applied filters:

```typescript
// In BookDet: link to audit trail for a specific booking
const auditUrl = `/organisasjon/audit?table=bookings&record_id=${booking.id}`;

// In Today: link to audit trail for a specific user
const auditUrl = `/organisasjon/audit?changed_by=${user.id}&from=${startOfMonth}`;
```

This keeps audit presentation centralized while allowing contextual access from any module.

---

## Relationship to Feature Modules

Organisasjon provides the **entities**. Feature modules provide the **capabilities**.

```
┌─────────────────────────────────────────────────────────────┐
│                     Organisasjon (Core)                      │
│                                                             │
│  Tenants ─ Organizations ─ Departments ─ Sub-departments    │
│  Users ─ Roles ─ Global Settings ─ Branding                 │
│  Billing ─ Subscriptions ─ AI Credits ─ Audit Logs          │
│                                                             │
├─────────────┬───────────────┬───────────────────────────────┤
│             │               │                               │
│  ▼ BookDet  │  ▼ Today      │  ▼ Future Modules             │
│             │               │                               │
│  Resources  │  Tasks        │  (Consume orgs, depts,        │
│  Bookings   │  Shifts       │   users, and settings          │
│  Calendars  │  Projects     │   from Organisasjon)           │
│  Customers  │  Time logs    │                               │
│             │               │                               │
└─────────────┴───────────────┴───────────────────────────────┘
```

### Concrete Examples

| Scenario | Organisasjon Provides | Feature Module Uses It For |
| --- | --- | --- |
| BookDet: creating a resource | list of organizations + departments | "Which org/dept does this room belong to?" |
| Today: assigning a task | list of users in a department | "Who can be assigned this task?" |
| BookDet: public booking page | tenant branding (logo, colors) | Rendering the customer-facing header |
| Today: shift planning | working hours default | Pre-filling shift start/end times |
| Any module: filtering data | org/dept hierarchy | "Show me only the Oslo branch" |
| Admin: audit log | user directory + roles | "Who did this, and were they authorized?" |

### Integration Pattern

Feature modules never duplicate organizational data. They **reference** it via foreign keys:

```sql
-- BookDet resource: references Organisasjon entities
CREATE TABLE resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    org_id      UUID REFERENCES organizations(id) ON DELETE SET NULL,     -- From Organisasjon
    dept_id     UUID REFERENCES departments(id) ON DELETE SET NULL,       -- From Organisasjon
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,
    -- ... module-specific fields
);

-- Today task: references Organisasjon entities
CREATE TABLE tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),                           -- From Organisasjon
    dept_id     UUID REFERENCES departments(id) ON DELETE SET NULL,       -- From Organisasjon
    title       TEXT NOT NULL,
    -- ... module-specific fields
);
```

---

## Data Ownership Boundaries

| Data | Owner | Consumers |
| --- | --- | --- |
| Tenant metadata (name, org number, branding) | **Organisasjon** | All modules |
| Organizational hierarchy (orgs, depts, sub-depts) | **Organisasjon** | All modules |
| User directory and role assignments | **Organisasjon** | All modules |
| Global settings (locale, timezone, working hours) | **Organisasjon** | All modules (as defaults) |
| Billing state (plan, subscription, payment method) | **Organisasjon** | All modules (for feature gating) |
| AI credit balance and transactions | **Organisasjon** | All AI-powered features |
| Audit logs (cross-module mutation history) | **Organisasjon** | All modules (read-only, via deep-links) |
| Resources (rooms, vehicles, equipment) | **BookDet** | BookDet only |
| Bookings and availability rules | **BookDet** | BookDet only |
| Tasks, projects, time logs | **Today** | Today only |

**Rule:** If a piece of data is used by more than one module, it belongs in Organisasjon. If it is used by only one module, it belongs in that module.

---

## Key Screens

### Organization Overview

```
┌─────────────────────────────────────────────────────────┐
│  Organisasjon  ▸  Hansen Bygg                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Oversikt                                            │
│  ├── 3 kontorer  ·  12 avdelinger  ·  47 brukere       │
│  └── Plan: Professional  ·  Neste faktura: 1. mai       │
│                                                         │
│  🏢 Organisasjoner          👥 Brukere                  │
│  ┌──────────────────┐       ┌──────────────────────┐    │
│  │ Oslo HK       ▸  │       │ 47 aktive brukere    │    │
│  │ Bergen filial  ▸  │       │ 3 ventende invit.    │    │
│  │ Stavanger     ▸  │       │ + Inviter bruker     │    │
│  └──────────────────┘       └──────────────────────┘    │
│                                                         │
│  ⚙️ Innstillinger                                       │
│  Lokale: Norsk · Tidssone: Europe/Oslo · Arbeidstid:    │
│  Man–Fre 07:00–15:30                                    │
└─────────────────────────────────────────────────────────┘
```

### Hierarchy Editor

```
┌─────────────────────────────────────────────────────────┐
│  Organisasjon  ▸  Struktur                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Hansen Bygg (Tenant)                                   │
│  │                                                      │
│  ├── 🏢 Oslo HK                                        │
│  │   ├── Elektro                                        │
│  │   │   ├── Sterkstrøm (sub-dept)                     │
│  │   │   └── Svakstrøm (sub-dept)                      │
│  │   ├── Rør                                            │
│  │   └── Administrasjon                                 │
│  │                                                      │
│  ├── 🏢 Bergen filial                                   │
│  │   ├── Elektro                                        │
│  │   └── Rør                                            │
│  │                                                      │
│  └── 🏢 Stavanger                                       │
│      └── Elektro                                        │
│                                                         │
│  [+ Legg til organisasjon]  [Importer fra CSV]          │
└─────────────────────────────────────────────────────────┘
```

---

## Access Control Model

Organisasjon manages roles at two levels:

### Global Roles (Set in Organisasjon)

| Role | Scope | Permissions |
| --- | --- | --- |
| `owner` | Entire tenant | Everything. Billing, user management, module config, data access. One per tenant. |
| `admin` | Entire tenant or scoped to org | User management within scope, module configuration, data access. |
| `member` | Assigned org/dept | Use modules within their assigned scope. Cannot manage users or settings. |
| `viewer` | Assigned org/dept | Read-only access within their assigned scope. |

### Module-Specific Role Overrides

A user with a global `member` role might need `admin` access in BookDet but only `viewer` access in Today. Organisasjon stores these overrides:

```sql
CREATE TABLE module_role_overrides (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module      TEXT NOT NULL,              -- 'bookdet', 'today', etc.
    role        TEXT NOT NULL,              -- 'admin', 'member', 'viewer'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, user_id, module)
);
```

Feature modules resolve the effective role by checking:
1. Module-specific override (if exists) → use it.
2. Otherwise → fall back to global role from `tenant_members`.

```typescript
export async function getEffectiveRole(userId: string, module: string) {
  const supabase = await createServerClient();

  // Check module override first
  const { data: override } = await supabase
    .from("module_role_overrides")
    .select("role")
    .eq("user_id", userId)
    .eq("module", module)
    .maybeSingle();

  if (override) return override.role;

  // Fall back to global role
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("user_id", userId)
    .single();

  return membership?.role ?? "viewer";
}
```
