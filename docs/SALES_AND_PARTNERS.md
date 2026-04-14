# Sales & Partner Program

> How Arbeidskassen scales distribution through internal and external sales partners who demo, onboard, and manage customer tenants — with full commission tracking and attribution.

---

## Table of Contents

- [Overview](#overview)
- [Sales Partner Entity](#sales-partner-entity)
- [Demo Tenants](#demo-tenants)
- [AI Credit Policy for Demos](#ai-credit-policy-for-demos)
- [Attribution Model](#attribution-model)
- [Sales Portal App](#sales-portal-app)
- [Commission Logic](#commission-logic)
- [Data Flow: Partner → Tenant → Payment → Commission](#data-flow-partner--tenant--payment--commission)
- [Security & Data Access](#security--data-access)

---

## Overview

The Sales & Partner layer enables Arbeidskassen to grow through a network of **sales partners** — either internal sales staff or external resellers and consultants. Each partner can:

1. **Demo the product** using a dedicated Demo Tenant that is exempt from billing.
2. **Onboard new customers** via a guided flow in the Sales Portal.
3. **Track portfolio performance** — MRR contribution, commission earned, customer health.

All commission rules are configured centrally in the Backoffice by platform admins. Partners interact exclusively through the Sales Portal module (route group `(authenticated)/sales-portal/`).

---

## Sales Partner Entity

A Sales Partner is a **global-level entity** — it is not scoped to any single tenant. Partners exist at the platform level alongside `platform_admins`.

### Data Model

```sql
CREATE TABLE sales_partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    company_name    TEXT,                       -- External partner's company (NULL for internal)
    type            TEXT NOT NULL DEFAULT 'external',  -- 'internal' | 'external'
    status          TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'suspended' | 'churned'

    -- Demo tenant
    demo_tenant_id  UUID UNIQUE REFERENCES tenants(id) ON DELETE SET NULL,

    -- Payout details
    bank_account    TEXT,                       -- Norwegian bank account number
    org_number      TEXT,                       -- Norwegian organization number (for invoicing)

    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sales_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_partners FORCE ROW LEVEL SECURITY;

-- Partners can only see their own record
CREATE POLICY "partner_read_own" ON sales_partners
    FOR SELECT USING (user_id = auth.uid());

-- Platform admins can manage all partners
CREATE POLICY "platform_admin_manage_partners" ON sales_partners
    FOR ALL TO platform_admin
    USING (true)
    WITH CHECK (true);
```

### Key Constraints

- A partner can own **at most one** Demo Tenant (`UNIQUE` constraint on `demo_tenant_id`).
- A partner can **refer** an unlimited number of customer tenants.
- Partners are **not** tenant members — they authenticate via a separate flow (similar to Backoffice users but with the `sales_partner` role).
- Internal partners (employees) and external partners (resellers) share the same data model but may have different commission rules.

---

## Demo Tenants

Each Sales Partner may be provisioned a **Demo Tenant** — a fully functional tenant used for demonstrations and training.

### Rules

| Rule | Details |
| --- | --- |
| **Billing exempt** | Demo Tenants are flagged with `is_demo = true` on the `tenants` table. All billing checks must skip Demo Tenants. |
| **One per partner** | A partner cannot have more than one Demo Tenant. |
| **Provisioned via Backoffice** | Platform admins create Demo Tenants and assign them to partners. Partners cannot self-provision. |
| **Data reset** | Platform admins can reset Demo Tenant data to a clean state via Backoffice tooling. |
| **No production use** | Demo Tenants are watermarked in the UI and cannot be converted to production. If a partner wants to onboard their own company, they create a separate paying tenant. |
| **Auto-suspend** | Demo Tenants for `suspended` or `churned` partners are automatically deactivated. |

### Schema Addition to `tenants`

```sql
ALTER TABLE tenants
    ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN referred_by_partner_id UUID REFERENCES sales_partners(id) ON DELETE SET NULL;

-- Index for quick partner portfolio lookups
CREATE INDEX idx_tenants_partner ON tenants (referred_by_partner_id)
    WHERE referred_by_partner_id IS NOT NULL;
```

---

## AI Credit Policy for Demos

Demo Tenants are billing-exempt for module access, but **AI credits are NOT unlimited**. Every AI API call costs real money, and uncontrolled demo usage can burn through the platform's API budget.

### Rules

| Rule | Details |
| --- | --- |
| **No automatic credits** | Demo Tenants start with `credit_balance = 0`. They do not receive credits from Stripe transactions (since there are none). |
| **Manual allocation only** | A platform admin must explicitly grant a "Demo Credit Quota" via Backoffice. Typical allocation: 50–200 credits per demo cycle. |
| **Same enforcement** | The `credit_balance` check in `consumeCredits()` applies identically to Demo Tenants and paying tenants. When balance reaches 0, AI features are disabled. |
| **Top-up on request** | Partners can request additional demo credits via the Sales Portal. The request is fulfilled by a Backoffice admin (not automatically). |
| **No carryover on reset** | When a Demo Tenant's data is reset, its credit balance is also reset to 0. New credits must be manually granted. |

### Resource Monitoring

The Backoffice must track AI usage at the **per-partner level** to identify potential abuse:

```sql
-- View: AI usage aggregated per sales partner
CREATE VIEW partner_ai_usage AS
SELECT
    sp.id AS partner_id,
    sp.name AS partner_name,
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.is_demo,
    ac.balance AS current_balance,
    COALESCE(SUM(act.credits_used), 0) AS total_credits_consumed,
    COUNT(act.id) AS total_ai_requests,
    MAX(act.created_at) AS last_ai_usage
FROM sales_partners sp
JOIN tenants t ON t.referred_by_partner_id = sp.id
LEFT JOIN ai_credits ac ON ac.tenant_id = t.id
LEFT JOIN ai_credit_transactions act ON act.tenant_id = t.id AND act.type = 'debit'
GROUP BY sp.id, sp.name, t.id, t.name, t.is_demo, ac.balance;
```

**Backoffice alerts** should fire when:
- A Demo Tenant consumes more than 80% of its allocated credits within 24 hours.
- A partner's total demo credit usage exceeds thresholds set by the platform admin.
- A partner requests credit top-ups more than 3 times per week.

---

## Attribution Model

Every tenant has an optional `referred_by_partner_id` column that tracks its sales origin.

### Attribution Rules

1. **Set at creation** — The `referred_by_partner_id` is set when a partner onboards a customer via the Sales Portal. It is immutable after tenant creation (prevents attribution hijacking).
2. **NULL = organic** — Tenants without a `referred_by_partner_id` signed up organically (self-serve). No commission is owed.
3. **Partner portfolio** — All tenants where `referred_by_partner_id = partner.id` constitute the partner's portfolio.
4. **Cascading deactivation** — If a partner is removed, `referred_by_partner_id` is set to NULL (attribution preserved in audit logs but no ongoing commission).

### Billing Impact

When processing Stripe webhook events (`invoice.paid`, `subscription.updated`, etc.), the billing logic in Organisasjon must:

1. Check if `tenant.is_demo = true` → **Skip all billing processing**.
2. Check if `tenant.referred_by_partner_id IS NOT NULL` → **Calculate commission** per applicable rules.
3. Process normally for organic tenants.

---

## Sales Portal Module

The Sales Portal is a route group under the main app at `(authenticated)/sales-portal/`.

### Route Structure (Target)

```
apps/arbeidskassen/app/(authenticated)/sales-portal/
├── page.tsx                     # Portfolio overview (MRR, customers, commission)
├── customers/                   # Referred tenant list
│   ├── page.tsx                 # All referred tenants (status, MRR, plan)
│   └── [id]/
│       └── page.tsx             # Individual tenant health (metadata only)
├── onboard/                     # New customer onboarding wizard
│   └── page.tsx                 # Step-by-step: company info → plan → payment → provisioning
├── demo/                        # Demo tenant management
│   └── page.tsx                 # Demo tenant overview, request data reset
├── commissions/                 # Earnings and payouts
│   ├── page.tsx                 # Commission history, pending payouts
│   └── rules/
│       └── page.tsx             # View applicable commission rules (read-only)
└── settings/                    # Partner profile, payout details
    └── page.tsx
```

> **Note:** The Sales Portal is currently a minimal placeholder. The route structure above is the target architecture.

### Capabilities

| Feature | Description |
| --- | --- |
| **Portfolio Dashboard** | Overview of all referred tenants: plan, MRR contribution, status, last activity. |
| **Customer Onboarding** | Guided wizard to create a new tenant with the partner as referrer. Collects company info, selects plan, initiates Stripe Checkout. |
| **Demo Management** | View Demo Tenant status. Request a data reset (fulfilled by Backoffice). |
| **Commission Tracker** | View earned commissions by period, pending payouts, and applicable rules. |
| **Tenant Health** | Per-customer view showing plan, MRR, subscription status — metadata only, no content access. |

### What the Sales Portal CANNOT Do

| Prohibited Action | Reason |
| --- | --- |
| Access tenant content (bookings, tasks, messages) | Tenant data isolation — partners are not tenant members |
| Modify tenant settings or structure | Managed by tenant admin via Organisasjon |
| Change commission rules | Managed by platform admins via Backoffice |
| Provision Demo Tenants | Managed by platform admins via Backoffice |
| Access other partners' data | RLS enforces partner-level isolation |

---

## Commission Logic

Commission rules are defined and managed exclusively in the **Backoffice** by platform admins.

### Commission Rules Table

```sql
CREATE TABLE commission_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,                  -- E.g., "BookDet Standard", "Enterprise Upsell Bonus"
    type            TEXT NOT NULL,                  -- 'percentage_mrr' | 'fixed_one_time' | 'percentage_one_time'
    value           NUMERIC(10, 4) NOT NULL,        -- E.g., 15.0000 for 15% or 500.0000 for 500 NOK
    currency        TEXT NOT NULL DEFAULT 'NOK',

    -- Scope: which products/plans this rule applies to
    applies_to_plan TEXT,                           -- NULL = all plans, or 'starter' | 'professional' | 'enterprise'
    applies_to_module TEXT,                         -- NULL = all modules, or 'bookdet' | 'today'

    -- Partner targeting
    partner_type    TEXT,                           -- NULL = all, 'internal' | 'external'

    -- Duration
    duration_months INTEGER,                        -- NULL = indefinite, or e.g. 12 for first year only

    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT true,

    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules FORCE ROW LEVEL SECURITY;

-- Only platform admins can manage rules
CREATE POLICY "platform_admin_manage_rules" ON commission_rules
    FOR ALL TO platform_admin
    USING (true)
    WITH CHECK (true);

-- Partners can read active rules
CREATE POLICY "partner_read_active_rules" ON commission_rules
    FOR SELECT USING (is_active = true AND auth.uid() IN (
        SELECT user_id FROM sales_partners WHERE status = 'active'
    ));
```

### Commission Ledger

```sql
CREATE TABLE commission_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id      UUID NOT NULL REFERENCES sales_partners(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id         UUID NOT NULL REFERENCES commission_rules(id) ON DELETE RESTRICT,

    -- Financial
    trigger_event   TEXT NOT NULL,          -- 'invoice.paid' | 'subscription.created'
    invoice_id      TEXT,                   -- Stripe invoice ID
    base_amount     NUMERIC(12, 2) NOT NULL, -- The amount the commission is calculated from
    commission_amount NUMERIC(12, 2) NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'NOK',

    -- Payout tracking
    status          TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'paid' | 'voided'
    paid_at         TIMESTAMPTZ,
    payout_reference TEXT,                  -- Bank transfer reference

    -- Metadata
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE commission_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_entries FORCE ROW LEVEL SECURITY;

-- Partners see only their own commissions
CREATE POLICY "partner_read_own_commissions" ON commission_entries
    FOR SELECT USING (partner_id IN (
        SELECT id FROM sales_partners WHERE user_id = auth.uid()
    ));

-- Platform admins manage all
CREATE POLICY "platform_admin_manage_commissions" ON commission_entries
    FOR ALL TO platform_admin
    USING (true)
    WITH CHECK (true);
```

### Commission Types

| Type | Description | Example |
| --- | --- | --- |
| `percentage_mrr` | Recurring % of monthly subscription revenue from the referred tenant | 15% of MRR for 12 months |
| `fixed_one_time` | Fixed NOK amount paid once when the tenant subscribes | 2 000 NOK per new Enterprise signup |
| `percentage_one_time` | % of the first invoice amount | 20% of first invoice |

### Calculation Flow

1. **Stripe webhook fires** (`invoice.paid`) in Organisasjon.
2. Organisasjon billing logic looks up `tenant.referred_by_partner_id`.
3. If a partner is attributed, query `commission_rules` for applicable rules (matching plan, module, partner type, within duration window).
4. For each matching rule, insert a `commission_entries` row with `status = 'pending'`.
5. Backoffice displays pending commissions for review and payout.

---

## Data Flow: Partner → Tenant → Payment → Commission

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Sales Partner│     │  Sales Portal   │     │   Organisasjon   │
│ (Person)     │     │  (App)          │     │   (Billing)      │
└──────┬───────┘     └────────┬────────┘     └────────┬─────────┘
       │                      │                       │
       │  1. Login            │                       │
       │─────────────────────>│                       │
       │                      │                       │
       │  2. Start Onboarding │                       │
       │─────────────────────>│                       │
       │                      │                       │
       │                      │  3. Create Tenant     │
       │                      │  (referred_by = partner.id)
       │                      │──────────────────────>│
       │                      │                       │
       │                      │  4. Redirect to       │
       │                      │  Stripe Checkout      │
       │                      │──────────────────────>│──> Stripe
       │                      │                       │
       │                      │                       │  5. Webhook:
       │                      │                       │  invoice.paid
       │                      │                       │<── Stripe
       │                      │                       │
       │                      │                       │  6. Check
       │                      │                       │  referred_by_partner_id
       │                      │                       │
       │                      │                       │  7. Calculate
       │                      │                       │  commission per
       │                      │                       │  commission_rules
       │                      │                       │
       │                      │                       │  8. Insert
       │                      │                       │  commission_entries
       │                      │                       │  (status: pending)
       │                      │                       │
       │  9. View Commission  │                       │
       │─────────────────────>│                       │
       │                      │  (reads own entries)  │
       │<─────────────────────│                       │
       │                      │                       │
       │                      │          ┌────────────┴──────────┐
       │                      │          │     Backoffice        │
       │                      │          │  10. Review & Approve │
       │                      │          │  11. Process Payout   │
       │                      │          └───────────────────────┘
```

---

## Security & Data Access

### Access Matrix

```
┌────────────────────┬────────────┬───────────────┬──────────────┬─────────────┐
│ Data               │ Partner    │ Backoffice    │ Tenant Admin │ Organisasjon│
│                    │ (Portal)   │ (Platform)    │ (Customer)   │ (Billing)   │
├────────────────────┼────────────┼───────────────┼──────────────┼─────────────┤
│ Own partner profile│ Read/Write │ Read/Write    │ ✗            │ ✗           │
│ Other partners     │ ✗          │ Read/Write    │ ✗            │ ✗           │
│ Commission rules   │ Read       │ Read/Write    │ ✗            │ Read        │
│ Own commissions    │ Read       │ Read/Write    │ ✗            │ Write       │
│ Other commissions  │ ✗          │ Read/Write    │ ✗            │ Write       │
│ Referred tenants   │ Metadata   │ Metadata      │ N/A          │ Full        │
│ Tenant content     │ ✗ BLOCKED  │ ✗ BLOCKED     │ Full (RLS)   │ ✗           │
│ Demo Tenant data   │ As member  │ Metadata      │ N/A          │ Skip billing│
└────────────────────┴────────────┴───────────────┴──────────────┴─────────────┘
```

### Key Security Rules

1. **Partners never access tenant content.** The Sales Portal shows tenant metadata (plan, MRR, status) but never bookings, tasks, messages, or user profiles.
2. **Commission data is partner-scoped.** RLS ensures a partner can only see their own commission entries.
3. **Commission rules are read-only for partners.** Only platform admins in Backoffice can create, modify, or deactivate rules.
4. **Demo Tenants bypass billing but not RLS.** A Demo Tenant functions like a normal tenant — it just skips Stripe integration. The partner interacts with it as a tenant member (admin role) for demo purposes.
5. **Attribution is immutable.** Once `referred_by_partner_id` is set during tenant creation, it cannot be changed via the Sales Portal or any tenant-facing app. Only Backoffice can reassign attribution in exceptional cases (logged in `platform_audit_logs`).
6. **Payout approval is manual.** Commission entries are calculated automatically but payouts require explicit Backoffice approval to prevent fraud.
