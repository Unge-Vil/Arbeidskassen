# Arbeidskassen — AI Coding Instructions

> These rules apply to ALL code generated in this monorepo. Violations are considered bugs.
> This is the **Single Source of Truth** for all AI agents (GitHub Copilot, Cursor, Windsurf, Aider, etc.).

---

## Table of Contents

- [Role](#role)
- [Project Structure](#project-structure)
- **Architecture & Rendering**
  - [Security — Zero Trust](#security--zero-trust-critical)
  - [Supabase & Database](#supabase--database)
  - [Client vs Server Components](#client-vs-server-components)
- **Code Standards**
  - [UI / UX](#ui--ux)
  - [Language Rules](#language-rules)
  - [Code Style](#code-style)
  - [File Naming](#file-naming)
  - [Error Handling](#error-handling)
  - [Dependencies](#dependencies)
- **Business Logic & Modules**
  - [Product & Business Alignment](#product--business-alignment)
  - [Global Core Context](#global-core-context)
  - [Backoffice & Privacy](#backoffice--privacy)
  - [Sales & Partnerships](#sales--partnerships)
  - [AI Cost Control](#ai-cost-control)
- **Design & Accessibility**
  - [Accessibility First (WCAG 2.1 AA)](#accessibility-first-wcag-21-aa)
  - [I18N & Theming](#i18n--theming)
  - [Contextual Design](#contextual-design)
- **Workflow & Process**
  - [POC Ingestion](#poc-ingestion)
  - [Blast Radius Awareness](#blast-radius-awareness)

---

# Architecture & Rendering

## Role

You are an expert in Next.js 15+ (App Router), React 19, TypeScript 5, Tailwind CSS v4, Supabase (PostgreSQL + Auth + RLS), and Stripe. Write concise, modern, type-safe code. Prefer Server Components by default.

## Project Structure

This is a Turborepo monorepo with pnpm workspaces. See [README.md](README.md) for the full structure.

- `apps/arbeidskassen` — Admin panel (port 3000)
- `apps/bookdet` — Booking module (port 3001)
- `apps/organisasjon` — Core organization module (port 3002)
- `apps/backoffice` — Platform owner admin (port 3099)
- `apps/sales-portal` — Sales & partner portal (port 3003)
- `packages/ui` — Shared shadcn/ui components
- `packages/supabase` — Database clients and types
- `packages/config` — Shared ESLint, Prettier, TypeScript configs

Detailed architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Security — Zero Trust (CRITICAL)

**The browser can NEVER be trusted.** Every mutation goes through Server Actions. Every Server Action follows this exact order:

1. **Authenticate** — `const supabase = await createServerClient(); const { data: { user } } = await supabase.auth.getUser();` — if no user, return an error immediately.
2. **Validate** — Parse all input with a Zod schema. Never use raw `FormData` values.
3. **Authorize** — Check the user's role/permissions if the action requires elevated access.
4. **Mutate** — Execute the database operation. RLS enforces tenant isolation automatically.
5. **Revalidate** — Call `revalidatePath()` or `revalidateTag()` after success.

Never skip steps. Never reorder steps. Never trust client-side state as authorization.

Full security model: [docs/SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md)

## Supabase & Database

### Schema Awareness (MCP)

We use the Model Context Protocol (MCP) for Supabase. **Before writing any code that reads or writes data:**

1. Use MCP tools to inspect the actual database schema (tables, columns, types).
2. Use MCP tools to check existing RLS policies.
3. Do NOT guess table names, column names, or relationships.
4. Do NOT invent schema that doesn't exist — ask the developer to create a migration first.

### Row Level Security (RLS)

- **Every tenant-scoped table has RLS enabled and enforced.** Assume all queries are automatically filtered by `tenant_id`.
- **Never use the `service_role` key** in application code. The only acceptable use is in webhook handlers (`api/webhooks/route.ts`) that process events from external services (Stripe, etc.).
- **Never bypass RLS** with `.rpc()` calls using `SECURITY DEFINER` functions unless explicitly approved in a code review.
- When creating new tables, always include `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE` and the four standard RLS policies (SELECT, INSERT, UPDATE, DELETE).

Database design: [docs/DATABASE_MULTI_TENANT.md](docs/DATABASE_MULTI_TENANT.md)

### Client Usage

```typescript
// Server Components and Server Actions — ALWAYS use server client
import { createServerClient } from "@arbeidskassen/supabase/server";

// Client Components (only for Realtime subscriptions and free tools)
import { createBrowserClient } from "@arbeidskassen/supabase/client";
```

## Client vs Server Components

### Server Components (default)

All components are Server Components unless they need browser interactivity. Use for:

- Authenticated pages, dashboards, data tables
- Data fetching (direct Supabase access via server client)
- Layouts, navigation, SEO-critical pages

### Client Components (`"use client"`)

Use ONLY when the component requires:

- Browser APIs (`window`, `localStorage`, `navigator`)
- Event handlers, controlled inputs, interactive UI
- Client-side state (`useState`, `useReducer`)
- Supabase Realtime subscriptions

### Free Tools (Calculators, Converters, etc.)

Free client-side tools MUST use `"use client"` and MUST NOT:

- Import from `@arbeidskassen/supabase/server`
- Call Server Actions
- Require authentication
- Make any server-side requests

These tools run entirely in the browser to minimize server costs.

### AI-Powered Features (OpenRouter)

Any feature using AI/LLM APIs (OpenRouter, etc.) MUST:

- Go through a secure API route (`route.ts`) or Server Action — never call AI APIs from the client
- Check authentication before processing
- Verify the user has available credits/quota before making the API call
- Log usage for billing purposes

---

# Code Standards

## UI / UX

- **Global CSS Import (CRITICAL):** All apps in this monorepo must import the global CSS from the UI package in their root `layout.tsx`. 
  - ✅ **Correct:** `import "@arbeidskassen/ui/globals.css";`
  - ❌ **Incorrect:** `import "./globals.css";` (This will break all theming and widget layouts).
- Use `shadcn/ui` components from `@arbeidskassen/ui`. Do not install shadcn/ui separately in apps.
- Use Tailwind CSS v4 utility classes. No custom CSS unless absolutely necessary.
- Use the `cn()` utility from `@arbeidskassen/ui` for conditional class merging.
- All modules (Today, BookDet, etc.) must reuse shared components from `packages/ui`.
- When a component is needed by more than one app, add it to `packages/ui`, not copied into each app.

## Language Rules

| Context | Language |
| --- | --- |
| Code (variable names, function names, comments) | **English** |
| Git commit messages | **English** |
| Documentation (docs/, README, .md files) | **English** |
| UI text displayed to end users | **Norwegian (Bokmål)** |
| Error messages shown to end users | **Norwegian (Bokmål)** |

Never mix languages within the same context. A Norwegian variable name or English-facing UI text is always a bug.

## Code Style

- Use `const` by default. Use `let` only when reassignment is necessary. Never use `var`.
- Use arrow functions for callbacks and inline functions. Use `function` declarations for top-level named exports.
- Use TypeScript strict mode. No `any` — use `unknown` and narrow with type guards.
- Use named exports, not default exports (exception: Next.js page/layout components which require default exports).
- Prefer early returns over nested conditionals.
- Destructure props at the function signature level.

## File Naming

- Components: `PascalCase.tsx` (e.g., `BookingCard.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useBookings.ts`, `formatDate.ts`)
- Server Actions: `actions.ts` (colocated with the route segment)
- Types: `types.ts` (colocated or in a shared `types/` directory)
- Route files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` (Next.js conventions)

## Error Handling

- Server Actions return `{ success: boolean; error?: string }` — never throw errors that leak internal details.
- Use `error.tsx` boundaries for unexpected errors in route segments.
- Use `loading.tsx` or `<Suspense>` for async data loading states.
- Log errors server-side for debugging. Show user-friendly Norwegian messages client-side.

## Dependencies

- Do not add new dependencies without checking if an existing package or built-in API covers the use case.
- All shared dependencies go in `packages/` — never install the same library in multiple apps.
- Use `workspace:*` for all internal package references.

---

# Business Logic & Modules

## Product & Business Alignment

When designing new features or data flows, ALWAYS refer to [docs/PRODUCT_VISION_AND_BUSINESS_LOGIC.md](docs/PRODUCT_VISION_AND_BUSINESS_LOGIC.md) to ensure the code supports our revenue model and UX vision. Specifically:

- **Free tools** must remain zero-cost to serve (client-side only, no server calls).
- **AI features** must enforce credit checks before API calls.
- **Billing changes** must account for both Stripe and EHF invoice paths.
- **New UI patterns** must align with the Command Palette / Tool Dock / Widget Dashboard paradigm.

## Global Core Context

The `Organisasjon` app (`apps/organisasjon`) is the **master authority** for organizational structure, user identity, and business operations. See [docs/CORE_ORGANIZATION_MODULE.md](docs/CORE_ORGANIZATION_MODULE.md) for the full specification.

- The hierarchy (Tenant → Organization → Department → Sub-department) is defined and managed exclusively in Organisasjon.
- All feature modules (BookDet, Today, etc.) **reference** Organisasjon entities via foreign keys — they never duplicate or independently manage orgs, departments, or user roles.
- Global settings (locale, timezone, working hours) live in Organisasjon and are consumed by other modules as defaults.
- User role resolution follows: module-specific override (if set) → global role from `tenant_members`.
- **All billing logic** (Stripe webhook handlers, subscription management, plan changes) resides exclusively in Organisasjon. Other modules read plan/subscription status but never modify it.
- **AI credit balance and transactions** are managed by Organisasjon. Feature modules consume credits via the shared `consumeCredits()` function but never directly modify balances.
- **The global audit log viewer** lives in Organisasjon. Feature modules write audit entries via PostgreSQL triggers but link to Organisasjon's UI for viewing history.
- Never create parallel billing, credit management, or audit log presentation logic inside a feature module.

## Backoffice & Privacy

The `backoffice` app (`apps/backoffice`) is for platform owners only. See [docs/SUPERADMIN_AND_SUPPORT.md](docs/SUPERADMIN_AND_SUPPORT.md) for the full specification.

- Code in `apps/backoffice` must **only** interact with metadata and system tables (`tenants`, `ai_credits`, `platform_admins`, `platform_audit_logs`, `support_access_grants`).
- **Never** write queries in backoffice that fetch PII or content from tenant-owned tables (`bookings`, `resources`, `tasks`, `chat_messages`, `profiles`, `audit_logs.old_data`/`new_data`).
- **Never** implement silent impersonation or "login as tenant" features.
- Support access to tenant data requires **explicit tenant admin consent** via the Consent-Based Support Access model: time-limited, scope-restricted, read-only, and heavily audited.
- All backoffice actions must be logged to `platform_audit_logs`.
- Backoffice authentication is separate from tenant authentication and requires MFA.

## Sales & Partnerships

The `sales-portal` app (`apps/sales-portal`) is for internal and external sales partners. See [docs/SALES_AND_PARTNERS.md](docs/SALES_AND_PARTNERS.md) for the full specification.

- When working on tenant creation or billing logic, always consider the `referred_by_partner_id` context.
- **Demo Tenants** (`is_demo = true`) owned by Sales Partners must be bypass-checked in all billing logic — never charge or create Stripe subscriptions for demo tenants.
- Commission data and partner statistics must be strictly restricted to `backoffice` (full access) and the specific partner's own view in `sales-portal` (RLS-scoped).
- Partners **cannot** access tenant content (bookings, tasks, messages). The Sales Portal shows only tenant metadata (plan, MRR, status).
- Attribution (`referred_by_partner_id`) is set at tenant creation and is immutable from tenant-facing or partner-facing apps.
- Commission rules are managed exclusively in Backoffice. Partners have read-only visibility of active rules.

## AI Cost Control

See [docs/CORE_ORGANIZATION_MODULE.md](docs/CORE_ORGANIZATION_MODULE.md) for credit management and [docs/SALES_AND_PARTNERS.md](docs/SALES_AND_PARTNERS.md) for demo credit policy.

- **Never** implement logic that grants unlimited or automatic AI credits to any tenant type.
- All AI features **must** check the `credit_balance` via `consumeCredits()` before making API calls. No exceptions.
- For Demo Tenants (`is_demo = true`), AI credits are a scarce resource that requires **manual allocation** from the Backoffice.
- For Sales Partners, demo credit usage must be monitored and capped — never assume demo usage is free.
- The only way to add credits without a Stripe transaction is via the Backoffice manual credit grant process.
- Credit checks must happen **before** the API call, not after. Never call an AI API optimistically and deduct later.

---

# Design & Accessibility

## Accessibility First (WCAG 2.1 AA)

This is a non-negotiable legal and ethical requirement. See [docs/I18N_THEMING_AND_WCAG.md](docs/I18N_THEMING_AND_WCAG.md) for the full specification.

- Write semantic HTML. Use `<button>` not `<div onClick>`. Use `<a href>` not `<span onClick>`.
- All icon-only buttons MUST have a descriptive `aria-label` (in Norwegian for user-facing UI).
- Never skip heading levels. Use `<h1>` → `<h2>` → `<h3>` in order.
- All form inputs MUST have an associated `<label>` element.
- All images must have appropriate `alt` text (or `alt=""` with `role="presentation"` for decorative images).
- Use `focus-visible:ring-2 focus-visible:ring-ring` for focus indicators (shadcn default).
- Ensure color contrast meets WCAG AA minimums (4.5:1 for normal text, 3:1 for large text).
- Never convey information through color alone — always pair with text, icons, or patterns.
- Respect `prefers-reduced-motion`. Animations must be non-essential.
- Use Radix UI primitives (via shadcn/ui) for all interactive patterns (modals, dropdowns, tabs, etc.) — do not build custom implementations.

## I18N & Theming

- **Never use hardcoded Tailwind colors** like `bg-blue-500` or `text-red-600`. Always use CSS variable-backed semantic classes: `bg-primary`, `text-destructive`, `text-muted-foreground`, `border-border`.
- **Theming** is handled via CSS custom properties in `packages/ui/src/globals.css` and `next-themes`. All color changes flow through CSS variables — never override colors inline.
- **Public-facing modules** (BookDet front-end, emails, notifications) MUST use `next-intl` translation functions from day one. Never hardcode user-facing text.
  - Server Components: `const t = await getTranslations("namespace");`
  - Client Components: `const t = useTranslations("namespace");`
- **Admin panel and free tools** may start with hardcoded Norwegian text but must use i18n-ready structure (extractable strings, no concatenated sentences).
- **Date and number formatting** must use `next-intl` formatters — never hardcode date formats like `DD.MM.YYYY`.

## Contextual Design

Distinguish between **Admin UI** and **Public UI**. They share components from `packages/ui` but have radically different visual identities.

- **Admin views** (Arbeidskassen dashboard): Compact, data-rich, neutral colors, high information density. Think Linear/Notion.
- **Public views** (BookDet booking pages, landing pages): Spacious, branded, conversion-optimized, generous whitespace. Think Cal.com/Calendly.
- **Shared components** from `packages/ui` must be theme-agnostic — use CSS variables, never hardcoded colors or spacing.
- **Visual divergence** is achieved through app-specific `globals.css` files that override CSS variables, not through component duplication.
- **Layout components** (sidebar, hero sections) are app-specific and live in the consuming app's `src/components/`, not in `packages/ui`.
- When building a shared component, ensure it looks appropriate in both dense (admin) and spacious (public) contexts.

---

# Workflow & Process

## POC Ingestion

See [docs/POC_INGESTION_WORKFLOW.md](docs/POC_INGESTION_WORKFLOW.md) for the full workflow.

- When asked to integrate code from `_poc-imports/`, **never** copy-paste it into production apps. Rewrite it completely.
- Strip away fake/hardcoded state — replace with `createServerClient()` data fetching and RLS-enforced queries.
- Map raw HTML/Tailwind to `@arbeidskassen/ui` (shadcn/ui) components. Do not recreate primitives that already exist.
- Replace hardcoded Tailwind colors (`bg-blue-500`) with CSS variable-backed semantic classes (`bg-primary`).
- Enforce strict TypeScript — no `any`, explicit props interfaces, named exports.
- Ensure WCAG 2.1 AA compliance — semantic HTML, labels, ARIA attributes, focus indicators.
- Apply the Server Action mutation pattern (authenticate → validate → authorize → mutate → revalidate).
- The `_poc-imports/` folder is **read-only inspiration**, not production code. Delete the subfolder after integration.

## Blast Radius Awareness

See [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) for the full development workflow.

- Before modifying **any** shared code in `packages/*` or proposing database schema/RLS changes, explicitly state the **blast radius** (which apps in `apps/*` consume this).
- Never alter existing props, function signatures, or column constraints in a way that breaks consumers.
- Prefer **adding** new optional props, new columns with defaults, or new functions alongside existing ones over mutating shared logic destructively.
- All database schema changes must go through **Supabase CLI migrations** (`supabase migration new`). Never suggest manual database edits via the Dashboard.
- Migration files are immutable once committed. Create a new migration to fix issues.
- When changing `packages/ui` or `packages/supabase`, run `pnpm build` to verify all consuming apps compile successfully.

- **UX Guidelines:** See `docs/UX_GUIDELINES.md` and `docs/I18N_THEMING_AND_WCAG.md` for exact rules on styling, Radix primitives, animations, and WCAG requirements.
