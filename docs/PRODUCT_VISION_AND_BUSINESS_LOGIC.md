# Product Vision & Business Logic

> The strategic blueprint behind Arbeidskassen — how the product generates value, how revenue flows, and the UX principles that tie everything together.

---

## Table of Contents

- [Vision Statement](#vision-statement)
- [Business Model](#business-model)
- [Free vs Paid Strategy](#free-vs-paid-strategy)
- [B2B Invoicing](#b2b-invoicing)
- [UX Vision: The Operating System](#ux-vision-the-operating-system)
- [Module Roadmap](#module-roadmap)

---

## Vision Statement

Arbeidskassen is **the daily operating system for Norwegian tradespeople and service businesses**. It replaces the fragmented landscape of booking tools, scheduling apps, calculators, and AI assistants with a single, unified platform where every tool is one keystroke away.

The core insight: **small businesses adopt tools they find useful for free, then upgrade when they need collaboration, persistence, and automation.** Arbeidskassen captures this journey — from a carpenter Googling "beam load calculator" to an entire construction firm managing bookings, daily operations, and AI-assisted estimates through a single subscription.

---

## Business Model

Arbeidskassen operates a **hybrid revenue model** with three distinct streams:

### 1. SaaS Subscriptions (Stripe)

The primary revenue stream. Paid modules are billed monthly or annually per tenant.

| Plan | Price Model | Includes |
| --- | --- | --- |
| **Free** | $0 | All client-side tools, no account required |
| **Starter** | Per tenant / month | One module (Today OR BookDet), 3 users, 1 organization |
| **Professional** | Per tenant / month | All modules, 15 users, unlimited organizations |
| **Enterprise** | Custom | All modules, unlimited users, SSO, dedicated support, SLA |

Stripe manages the full subscription lifecycle:

- **Checkout** — Stripe Checkout Sessions for initial signup
- **Billing** — Automated recurring invoices via Stripe Billing
- **Upgrades/Downgrades** — Proration handled by Stripe
- **Dunning** — Automated retry and recovery for failed payments
- **Cancellation** — Grace period with data retention before hard delete

#### Stripe Integration Architecture

```
User clicks "Upgrade"
  → Server Action: authenticate + authorize (must be tenant owner/admin)
  → Create Stripe Checkout Session (server-side)
  → Redirect to Stripe Checkout (client-side)
  → Stripe processes payment
  → Stripe sends webhook → api/webhooks/stripe/route.ts
    → Verify webhook signature (service_role — only allowed use)
    → Update tenant plan in database
    → Provision module access
    → revalidatePath("/settings/billing")
```

**Critical rule:** The application never stores credit card numbers. Stripe is the sole PCI-compliant payment handler. The `stripe_customer_id` on the `tenants` table is the only billing-related field in our database.

### 2. AI Credit System (OpenRouter)

A usage-based revenue stream for AI-powered features. Users purchase credit packs that are consumed per API call.

| Feature | Credit Cost | Backend |
| --- | --- | --- |
| AI estimate generator | 5 credits / request | OpenRouter (GPT-4o / Claude) |
| Document summarizer | 3 credits / page | OpenRouter |
| Smart scheduling assistant | 2 credits / suggestion | OpenRouter |
| Chat assistant (Tiptap) | 1 credit / message | OpenRouter |

#### Credit System Architecture

```sql
CREATE TABLE ai_credits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    balance     INTEGER NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_credit_transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount      INTEGER NOT NULL,            -- Positive = purchase, negative = usage
    reason      TEXT NOT NULL,               -- 'purchase', 'estimate', 'chat', etc.
    reference_id UUID,                       -- Links to the Stripe payment or the AI request
    created_by  UUID REFERENCES auth.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Credit Flow

```
User triggers AI feature (e.g., "Generate Estimate")
  → Server Action: authenticate
  → Server Action: check ai_credits.balance >= required_credits
    → If insufficient: return { error: "Ikke nok kreditter" }
  → Server Action: call OpenRouter API (server-side only, API key never exposed)
  → Server Action: deduct credits in a transaction
  → Server Action: log usage in ai_credit_transactions
  → Return AI result to client
```

**Critical rules:**
- AI API keys (OpenRouter) are **never** exposed to the client. All calls route through Server Actions or API routes.
- Credit balance is checked **before** making the API call, not after.
- Credit deduction and API call are wrapped in a transaction — if the API call fails, credits are refunded.

### 3. Infrastructure Revenue (Indirect)

Free tools drive organic traffic (SEO) which:
- Builds brand awareness in the Norwegian trades market
- Creates a funnel from free user → registered user → paying tenant
- Generates ad-free goodwill (we do not run ads — the tools are genuinely free)

---

## Free vs Paid Strategy

The free/paid divide is the most important architectural boundary in the system. It determines rendering strategy, authentication requirements, and cost structure.

### Free Tools (Client-Side)

| Characteristic | Requirement |
| --- | --- |
| **Directive** | `"use client"` — mandatory |
| **Authentication** | None — no login, no session, no cookies |
| **Data persistence** | `localStorage` only (user's browser) |
| **Server calls** | Zero — no Server Actions, no API routes, no Supabase |
| **Dependencies** | Only `@arbeidskassen/ui` and browser APIs |
| **Hosting cost** | Effectively $0 (static HTML/JS served from CDN) |
| **SEO value** | High — these pages are indexed and drive organic traffic |

#### Examples of Free Tools

- Beam load calculator (bjelkelastkalkulator)
- Paint coverage calculator (malekalkulator)
- Currency/unit converters
- Invoice templates (client-side PDF generation)
- Work hour calculator (timelister)

#### Free Tool Architecture

```
apps/arbeidskassen/app/(tools)/
├── layout.tsx                    # Minimal layout — NO auth, NO Supabase imports
├── calculator/
│   ├── page.tsx                  # SEO metadata (Server Component, no data fetching)
│   └── CalculatorClient.tsx      # "use client" — all logic runs in browser
├── converter/
│   ├── page.tsx
│   └── ConverterClient.tsx
└── ...
```

The `page.tsx` can be a thin Server Component that provides metadata for SEO, but the actual tool component must be a Client Component with zero server dependencies.

### Paid Modules (Server-Powered)

| Characteristic | Requirement |
| --- | --- |
| **Directive** | Server Components by default, `"use client"` only for interactivity |
| **Authentication** | Required — every page checks session |
| **Data persistence** | Supabase PostgreSQL with RLS |
| **Server calls** | Server Actions for mutations, server-side data fetching |
| **Dependencies** | Full stack — `@arbeidskassen/supabase`, `@arbeidskassen/ui`, Stripe |
| **Hosting cost** | Per-request compute (justified by subscription revenue) |

### AI Tools (Hybrid)

| Characteristic | Requirement |
| --- | --- |
| **Authentication** | Required — must be logged in |
| **Credit check** | Required — must have sufficient credits |
| **API call** | Server-side only (Server Action or API route) |
| **UI** | Client Component for interactivity, but all AI logic on server |

### The Conversion Funnel

```
┌─────────────────────────────────────────────────────────┐
│  STAGE 1: Discovery (Free)                              │
│  User finds a free tool via Google                      │
│  → No login required, tool works immediately            │
│  → User bookmarks the tool, returns regularly           │
├─────────────────────────────────────────────────────────┤
│  STAGE 2: Registration (Free)                           │
│  User creates an account to save preferences            │
│  → Optional login, localStorage → cloud sync            │
│  → Sees "Pro" features in the navigation                │
├─────────────────────────────────────────────────────────┤
│  STAGE 3: Trial (Free, time-limited)                    │
│  User activates a 14-day trial of a paid module         │
│  → Full access to BookDet or Today                      │
│  → Trial status tracked on tenant record                │
├─────────────────────────────────────────────────────────┤
│  STAGE 4: Subscription (Paid)                           │
│  User subscribes via Stripe Checkout                    │
│  → Recurring billing, full module access                │
│  → Can purchase AI credit packs as add-ons              │
├─────────────────────────────────────────────────────────┤
│  STAGE 5: Expansion (Paid, growing)                     │
│  Tenant adds more users, organizations, modules         │
│  → Upgrades to Professional or Enterprise               │
│  → Cross-tenant collaboration via ACL                   │
└─────────────────────────────────────────────────────────┘
```

---

## B2B Invoicing

Norwegian B2B customers have specific invoicing requirements that differ from standard Stripe card payments.

### Dual Invoicing Strategy

```
┌─────────────────────────────────────────┐
│  Payment Method Selection               │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │ Card/Credit  │   │ EHF Invoice     │  │
│  │ (Stripe)     │   │ (B2B Norway)    │  │
│  └──────┬───────┘   └───────┬─────────┘  │
│         │                   │             │
│         ▼                   ▼             │
│  Stripe Billing      External Accounting  │
│  - Instant payment   System API           │
│  - Auto-retry        - Tripletex / Fiken  │
│  - Self-service      - 14/30 day terms    │
│                      - EHF via PEPPOL     │
│                      - Norwegian law       │
│                      compliant             │
└─────────────────────────────────────────┘
```

### Stripe Path (Default)

- **For:** Small businesses, freelancers, international customers
- **Method:** Credit card or direct debit via Stripe
- **Billing cycle:** Monthly or annual, prepaid
- **Invoice:** Stripe-generated invoice (PDF)
- **Dunning:** Automated by Stripe (retry failed payments, send reminders)

### EHF Invoice Path (Norwegian B2B)

- **For:** Norwegian companies that require formal EHF (Elektronisk Handelsformat) invoices
- **Method:** Traditional invoice with payment terms (14 or 30 days net)
- **Billing cycle:** Monthly, post-paid
- **Invoice format:** EHF 3.0 via PEPPOL network (legally required for Norwegian public sector, widely adopted in private sector)
- **Integration:** External accounting system API (Tripletex, Fiken, or PowerOffice) handles invoice generation and transmission

#### EHF Flow

```
Billing cycle ends
  → Cron job / scheduled Edge Function
    → Calculate usage for the period (subscription + AI credits consumed)
    → POST to accounting system API
      → Accounting system generates EHF invoice
      → Sends via PEPPOL to customer's EHF inbox
    → Store invoice reference in our database
    → Update tenant billing status

Payment received (reconciliation)
  → Accounting system webhook / polling
    → Match payment to invoice
    → Update tenant payment status
    → If overdue: send reminder → suspend after grace period
```

#### Data Model for EHF

```sql
-- Extends the tenants table
ALTER TABLE tenants ADD COLUMN billing_method TEXT NOT NULL DEFAULT 'stripe';
-- 'stripe' = card/credit via Stripe
-- 'ehf' = Norwegian EHF invoice via accounting system

ALTER TABLE tenants ADD COLUMN org_number TEXT;
-- Norwegian organization number (required for EHF)
-- Format: 9 digits, validated with MOD11 check

ALTER TABLE tenants ADD COLUMN ehf_address TEXT;
-- PEPPOL participant identifier (e.g., 0192:123456789)
```

**Critical rule:** The billing method does NOT affect feature access. Whether a tenant pays via Stripe or EHF, module provisioning logic is identical. Only the payment reconciliation path differs.

---

## UX Vision: The Operating System

Arbeidskassen should feel like a **lightweight operating system for work**, not a collection of disconnected SaaS tools. Every interaction should reinforce the feeling that the user is in a single, cohesive environment.

### Design Principles

1. **One Keystroke Away** — Any action in the system should be reachable within 2 keystrokes from the Command Palette.
2. **Context Preservation** — Switching between modules should never lose the user's context. The current date, selected team, and active filters persist across navigation.
3. **Progressive Disclosure** — Show simple defaults, reveal complexity on demand. A new user sees a clean dashboard; a power user sees keyboard shortcuts and batch operations.
4. **Real-Time by Default** — Changes by one user are visible to teammates instantly (Supabase Realtime). No "refresh to see updates."

### Core UX Components

#### 1. Command Palette (Cmd+K / Ctrl+K)

The universal entry point. A Spotlight-style search that indexes:

- **Navigation** — Go to any page, module, or tool
- **Actions** — "Create booking", "Add team member", "Generate estimate"
- **Data** — Search bookings, customers, resources across all modules
- **Recent** — Last 10 visited pages and performed actions

```
┌─────────────────────────────────────────────┐
│  🔍 Search or type a command...              │
├─────────────────────────────────────────────┤
│  📅  Go to Today                    Ctrl+1  │
│  📋  Go to BookDet                  Ctrl+2  │
│  ➕  Create new booking             Ctrl+N  │
│  👤  Search customers...                     │
│  ⚙️  Open settings                  Ctrl+,  │
├─────────────────────────────────────────────┤
│  Recent                                      │
│  📅  Booking: Elektriker — 14:00 i dag      │
│  👤  Ola Nordmann — sist redigert            │
└─────────────────────────────────────────────┘
```

**Implementation:** Client Component (`"use client"`) using `cmdk` (shadcn/ui Command component). Data fetched via Server Actions, cached locally for instant results.

#### 2. Tool Dock

A persistent sidebar or bottom bar showing:

- Pinned modules (Today, BookDet, Tools)
- Quick-access tools (calculator, timer, notes)
- Notification badge count
- Active team/organization selector

The dock persists across all routes via the root layout. Clicking a dock item navigates without full page reload (Next.js client-side navigation).

#### 3. Widget Dashboard

The home screen (`/dashboard`) is a customizable grid of widgets driven by `react-grid-layout`.

- **Edit Mode**: Dashboards are locked by default to prevent accidental clicks/drags. Editing the layout (position, size, adding, or deleting widgets) requires clicking into an explicit "Rediger Layout" state.
- **Explicit Saves**: Changes wait in a local draft state and are only synced to the backend (`layout_config` JSONB array in the `user_dashboards` table) when explicitly saving. This reduces database strain.
- **Multiple Dashboards**: Users can create multiple dashboard tabs (e.g. "Sales", "Support", "Hoved") that each hold unique widgets.

| Widget | Data Source | Update Frequency |
| --- | --- | --- |
| App Snarveier | Static props | - |
| Kalkulator | Local state | - |
| Today's bookings | BookDet module | Real-time |
| Team availability | Today module | Real-time |
| Revenue this month | Stripe API | Hourly |
| Pending invoices | Accounting API | Daily |
| AI credit balance | `ai_credits` table | On change |
| Quick actions | Static | — |

Widgets are React components rendered within the responsive grid. Backend data fetching happens asynchronously without blocking the shell.

#### 4. Global Chat (Tiptap)

A persistent, collapsible chat panel powered by [Tiptap](https://tiptap.dev/) that supports:

- **Rich text** — formatting, lists, code blocks
- **Cross-module @mentions** — `@booking:1234` links to a specific booking, `@customer:ola` links to a customer profile, `@team:elektro` notifies the Elektro department
- **AI assistant** — `@ai` invokes the AI chat assistant (consumes credits)
- **File attachments** — images and documents stored in Supabase Storage
- **Threads** — reply to specific messages to keep conversations organized

```
┌──────────────────────────────────────────┐
│  💬 Team Chat                     ─ □ ✕  │
├──────────────────────────────────────────┤
│  Kari (14:32):                           │
│  Kan noen ta @booking:4521 i morgen?     │
│  Kunden trenger elektriker kl 09.         │
│                                          │
│  Per (14:33):                            │
│  @kari Jeg tar den. @ai kan du oppsummere│
│  hva som ble avtalt med kunden?          │
│                                          │
│  🤖 AI (14:33):                          │
│  Basert på booking #4521: Kunden ønsker  │
│  installasjon av 3 stk. veggkontakter... │
├──────────────────────────────────────────┤
│  ┌────────────────────────────────────┐  │
│  │ Type a message... @mention for     │  │
│  │ cross-module links                 │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Implementation:**
- **Editor:** Tiptap with custom extensions for @mentions
- **Backend:** Supabase Realtime for instant message delivery
- **Storage:** Messages in a `chat_messages` table with `tenant_id` + RLS
- **AI:** @ai mentions trigger a Server Action → OpenRouter → credit deduction → streamed response

#### 5. Keyboard-First Navigation

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl + K` | Open Command Palette |
| `Cmd/Ctrl + 1-9` | Switch to module by position |
| `Cmd/Ctrl + N` | Create new item (context-aware) |
| `Cmd/Ctrl + ,` | Open settings |
| `Cmd/Ctrl + /` | Toggle chat panel |
| `Esc` | Close modal / palette / panel |

Shortcuts are registered globally in the root layout via a Client Component that listens for keyboard events.

---

## Module Roadmap

| Phase | Module | Revenue Stream | Status |
| --- | --- | --- | --- |
| **Phase 1** | Free Tools (calculators, converters) | SEO traffic → funnel | In development |
| **Phase 1** | Admin Panel (Arbeidskassen) | — (infrastructure) | In development |
| **Phase 2** | BookDet (booking) | SaaS subscription | Planned |
| **Phase 2** | AI Tools (estimates, chat) | Credit system | Planned |
| **Phase 3** | Today (daily ops) | SaaS subscription | Planned |
| **Phase 3** | Global Chat (Tiptap) | Included in subscription | Planned |
| **Phase 4** | Marketplace (third-party integrations) | Revenue share | Future |
