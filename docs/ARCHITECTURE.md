# Architecture

> How Arbeidskassen uses Next.js App Router to deliver free client-side tools alongside premium server-powered modules — all within a single monorepo.

---

## Table of Contents

- [Design Principles](#design-principles)
- [Rendering Strategy](#rendering-strategy)
- [Server Actions](#server-actions)
- [Application Boundaries](#application-boundaries)
- [Data Flow](#data-flow)
- [UI Architecture & Visual Identity](#ui-architecture--visual-identity)
- [Package Dependency Graph](#package-dependency-graph)

---

## Design Principles

1. **Free at the Edge, Paid on the Server** — Client Components deliver zero-auth tools that run entirely in the browser. Server Components and Server Actions gate access to persistent, multi-tenant data behind authentication and authorization.
2. **Server-First by Default** — Every component is a React Server Component (RSC) unless it explicitly needs browser APIs, interactivity, or client-side state. This minimizes the JavaScript shipped to users and keeps secrets on the server.
3. **Colocation over Abstraction** — Data fetching, mutations, and UI live close together inside route segments. Shared logic is extracted to `packages/` only when two or more apps genuinely need it.
4. **Progressive Enhancement** — Forms powered by Server Actions work without JavaScript. Client-side enhancements (optimistic UI, real-time updates) layer on top.

---

## Rendering Strategy

### Server Components (default)

All `.tsx` files inside `app/` are Server Components unless they include the `"use client"` directive. Server Components are used for:

- **Authenticated pages** — dashboard layouts, admin panels, data tables.
- **Data fetching** — direct database access via `@arbeidskassen/supabase/server` without exposing credentials or network waterfalls to the client.
- **SEO-critical pages** — marketing pages, public booking pages rendered as static or server-rendered HTML.
- **Layouts and navigation** — the root layout, sidebar, and breadcrumb components that rarely change and benefit from streaming.

```
app/
├── layout.tsx              ← Server Component (auth check, session provider)
├── page.tsx                ← Server Component (dashboard with data)
├── bookings/
│   ├── page.tsx            ← Server Component (fetch bookings list)
│   └── [id]/
│       └── page.tsx        ← Server Component (fetch single booking)
```

### Client Components (`"use client"`)

Used **only** when the component requires:

- Browser APIs (`window`, `navigator`, `localStorage`)
- Event handlers and interactivity (`onClick`, `onChange`, drag-and-drop)
- Client-side state (`useState`, `useReducer`, third-party state managers)
- Real-time subscriptions (Supabase Realtime channels)

Typical Client Component use cases:

| Component | Reason |
| --- | --- |
| Free tools (calculators, converters) | Run entirely in the browser, no server needed |
| Calendar / date picker | Complex interactivity |
| Booking form | Controlled inputs, optimistic updates |
| Real-time presence indicators | Supabase Realtime subscription |
| Toast / notification system | Client-side state |

**Rule:** Client Components are leaf nodes. They receive serializable props from parent Server Components and never import server-only code.

### The Boundary Pattern

```
┌─────────────────────────────────────────┐
│  Server Component (layout.tsx)          │
│  - Authenticates user                   │
│  - Fetches tenant context               │
│  - Renders shell / navigation           │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Server Component (page.tsx)      │  │
│  │  - Fetches data from Supabase     │  │
│  │  - Passes serializable props ↓    │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Client Component           │  │  │
│  │  │  "use client"               │  │  │
│  │  │  - Interactive UI           │  │  │
│  │  │  - Calls Server Actions     │  │  │
│  │  │  - Local state only         │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Server Actions

Server Actions are the **exclusive mutation layer** in Arbeidskassen. No custom API routes (`route.ts`) are used for data mutations — all writes go through Server Actions.

### Why Server Actions

- **Colocated with UI** — actions live in the same file or a nearby `actions.ts`, making the data flow obvious.
- **Type-safe end-to-end** — input and return types flow from the action definition to the calling component without manual serialization.
- **Progressive enhancement** — `<form action={myAction}>` works without JavaScript.
- **Built-in security surface** — every action runs on the server, so authentication/authorization checks happen before any data access.

### Action Structure

```typescript
// app/bookings/actions.ts
"use server";

import { createServerClient } from "@arbeidskassen/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateBookingSchema = z.object({
  title: z.string().min(1).max(200),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  resourceId: z.string().uuid(),
});

export async function createBooking(formData: FormData) {
  // 1. Authenticate
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 2. Validate input
  const parsed = CreateBookingSchema.safeParse({
    title: formData.get("title"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    resourceId: formData.get("resourceId"),
  });
  if (!parsed.success) throw new Error("Invalid input");

  // 3. Mutate (RLS enforces tenant isolation)
  const { error } = await supabase
    .from("bookings")
    .insert({ ...parsed.data, created_by: user.id });
  if (error) throw new Error("Failed to create booking");

  // 4. Revalidate
  revalidatePath("/bookings");
}
```

### Action Rules

1. **Always authenticate** — check `supabase.auth.getUser()` at the top of every action.
2. **Always validate** — use Zod schemas for all inputs. Never trust `FormData` or JSON payloads directly.
3. **Never expose internal errors** — catch database errors and return user-friendly messages.
4. **Revalidate affected paths** — call `revalidatePath()` or `revalidateTag()` after successful mutations.
5. **No direct database access from Client Components** — clients call Server Actions, never Supabase directly (except for Realtime subscriptions and free client-side tools).

---

## Application Boundaries

### `apps/arbeidskassen` — Admin Panel

The central hub for tenant administrators. Primarily Server Components with authenticated routes.

```
apps/arbeidskassen/app/
├── (auth)/                  # Auth routes (login, signup, callback)
│   ├── login/page.tsx
│   └── callback/route.ts
├── (dashboard)/             # Authenticated layout group
│   ├── layout.tsx           # Sidebar, tenant context provider
│   ├── page.tsx             # Dashboard overview
│   ├── users/               # User management
│   ├── billing/             # Stripe integration
│   └── settings/            # Tenant settings
└── (marketing)/             # Public pages (pricing, features)
    └── page.tsx
```

### `apps/bookdet` — Booking Module

Customer-facing booking pages (public, SSR) and internal management views (authenticated).

```
apps/bookdet/app/
├── (public)/                # Public booking pages (SSR/SSG)
│   └── [slug]/              # Tenant-specific booking page
│       └── page.tsx
├── (dashboard)/             # Internal booking management
│   ├── layout.tsx
│   ├── calendar/
│   ├── resources/
│   └── settings/
└── api/
    └── webhooks/            # Stripe webhook handler
        └── route.ts
```

### `apps/organisasjon` — Core Organization Module

The system-wide Source of Truth for organizational identity, hierarchy, and user governance. Included in every subscription tier.

```
apps/organisasjon/app/
├── (auth)/                  # Auth routes
│   ├── login/page.tsx
│   └── callback/route.ts
├── (dashboard)/             # Authenticated management views
│   ├── layout.tsx           # Sidebar, org context provider
│   ├── page.tsx             # Organization overview
│   ├── structure/           # Org → Dept → Sub-dept hierarchy editor
│   ├── users/               # User directory, invitations, role assignment
│   └── settings/            # Global tenant settings (locale, timezone, etc.)
└── api/
    └── webhooks/
        └── route.ts
```

See [docs/CORE_ORGANIZATION_MODULE.md](../docs/CORE_ORGANIZATION_MODULE.md) for the full specification.

### `apps/backoffice` — Platform Owner Administration

Internal-only tool for platform operators. Strict GDPR data isolation — can manage tenant metadata and system resources but cannot access tenant content.

```
apps/backoffice/app/
├── (auth)/                      # Separate auth flow (MFA mandatory)
│   ├── login/page.tsx
│   └── mfa/page.tsx
├── (dashboard)/
│   ├── layout.tsx               # Backoffice shell
│   ├── page.tsx                 # System overview (MRR, health)
│   ├── tenants/                 # Tenant directory (metadata only)
│   ├── credits/                 # Global credit management
│   ├── billing/                 # Stripe global view
│   ├── features/                # Feature flag management
│   └── logs/                    # Platform audit logs
```

See [docs/SUPERADMIN_AND_SUPPORT.md](../docs/SUPERADMIN_AND_SUPPORT.md) for the full specification, data isolation rules, and consent-based support access model.

### `apps/sales-portal` — Sales & Partner Portal

Partner-facing app for internal and external salespeople. Provides customer onboarding, portfolio tracking, and commission visibility. Partners cannot access tenant content — only metadata.

```
apps/sales-portal/app/
├── (auth)/                      # Partner-specific auth
│   ├── login/page.tsx
│   └── callback/route.ts
├── (dashboard)/
│   ├── layout.tsx               # Partner shell
│   ├── page.tsx                 # Portfolio overview (MRR, customers, commission)
│   ├── customers/               # Referred tenant list (metadata only)
│   ├── onboard/                 # New customer onboarding wizard
│   ├── demo/                    # Demo tenant management
│   ├── commissions/             # Earnings and payouts
│   └── settings/                # Partner profile, payout details
```

See [docs/SALES_AND_PARTNERS.md](../docs/SALES_AND_PARTNERS.md) for the full specification, commission logic, and attribution model.

### `apps/today` — Daily Operations Workspace

`today` is currently an early shared shell for planning, coordination, and day-of execution workflows. It is intentionally lightweight while the data model and operational features are still being shaped.

```
apps/today/app/
└── [locale]/
    ├── layout.tsx             # Shared localized shell
    └── page.tsx               # `ModuleComingSoonPage` preview surface
```

The canonical same-domain route is `/{locale}/today`; in local development the module runs on `http://localhost:3004/{locale}`.

### `apps/teamarea` — Internal Collaboration Feed

`teamarea` is the collaboration-focused surface for announcements, updates, and cross-team communication. The repo currently includes a preview feed shell that keeps navigation, theming, and localization aligned while backend integration is still evolving.

```
apps/teamarea/app/
└── [locale]/
    ├── layout.tsx             # Shared shell + navbar wiring
    ├── page.tsx               # Feed-style preview page
    └── teamarea-shell.tsx     # Left-nav collaboration layout
```

The canonical same-domain route is `/{locale}/teamarea`; in local development the module runs on `http://localhost:3005/{locale}` and can fall back to preview mode without a live Supabase connection.

### Cross-App Route Model

The main `arbeidskassen` app keeps the public landing and shared login at `/` and `/login`. The **primary product model** is a single coherent app experience on one main domain, with module URLs such as `/no/bookdet`, `/no/today`, `/no/teamarea`, `/no/backoffice`, and `/no/sales-portal`.

Shared routing helpers support two operational modes behind that same URL contract:

- **Default / one-project same-domain mode**: the main app owns the canonical module routes directly.
- **Optional proxy mode**: if a module later runs on its own deployment URL, the same canonical route can proxy there without changing what users see.
- **Local development** routes the same navigation targets to each app's own localhost port (`3001`, `3004`, `3005`, `3099`, etc.).

### Free Client-Side Tools

Standalone pages that ship **zero server dependencies**. These are pure Client Components that can be statically generated and served from a CDN.

```
apps/arbeidskassen/app/(tools)/
├── layout.tsx               # Minimal layout, no auth
├── calculator/page.tsx      # "use client" — runs in browser
├── converter/page.tsx       # "use client" — runs in browser
└── templates/page.tsx       # "use client" — runs in browser
```

---

## Data Flow

### Read Path (Server Components)

```
Browser Request
  → Next.js Server (Edge/Node)
    → Server Component renders
      → createServerClient() (with cookies)
        → Supabase PostgreSQL (RLS filters by tenant_id)
      ← Data returned
    ← HTML streamed to browser
```

### Write Path (Server Actions)

```
User Interaction (form submit / button click)
  → Server Action invoked
    → Authenticate (getUser)
    → Validate (Zod schema)
    → createServerClient()
      → Supabase PostgreSQL INSERT/UPDATE/DELETE (RLS enforced)
    ← revalidatePath() triggers re-render
  ← Updated UI streamed to browser
```

### Real-Time Path (Client Components)

```
Client Component mounts
  → createBrowserClient()
    → supabase.channel("room").on("postgres_changes", ...)
      ← Real-time events pushed via WebSocket
    → Local state updated → React re-renders
```

### Sales Partner Path (Onboarding → Commission)

```
Sales Partner (via sales-portal)
  → Onboarding Wizard: collects company info, selects plan
    → Server Action: creates tenant with referred_by_partner_id = partner.id
      → Redirect to Stripe Checkout
        → Customer pays → Stripe webhook: invoice.paid
          → Organisasjon billing handler:
            1. Skip if tenant.is_demo = true
            2. Look up referred_by_partner_id
            3. Query matching commission_rules
            4. Insert commission_entries (status: pending)
          → Backoffice: review → approve → process payout
```

---

## Package Dependency Graph

```
apps/arbeidskassen ──┬── @arbeidskassen/ui
apps/bookdet ────────┤
apps/organisasjon ───┤
apps/today ──────────┤
apps/teamarea ───────┤
apps/backoffice ─────┤
apps/sales-portal ───┘
                      ├── @arbeidskassen/supabase
                      └── @arbeidskassen/config

@arbeidskassen/ui ───┬── @arbeidskassen/config
                     └── (tailwindcss, clsx, tailwind-merge)

@arbeidskassen/supabase ─┬── @arbeidskassen/config
                         └── (@supabase/supabase-js, @supabase/ssr, local CLI workspace)

@arbeidskassen/config ───── (eslint, prettier, typescript configs — no runtime deps)
```

All workspace dependencies use `workspace:*` protocol via pnpm, ensuring local packages are always resolved from the monorepo rather than a registry.

---

## UI Architecture & Visual Identity

Arbeidskassen serves two fundamentally different audiences through a single monorepo. The visual language for each audience is radically different, but the underlying component library is shared. This section explains how and why.

### The Two UI Modes

| Dimension | Admin UI (Arbeidskassen Dashboard) | Public UI (BookDet Booking Pages, Landing Pages) |
| --- | --- | --- |
| **Audience** | Internal users: business owners, managers, employees | External users: customers booking services, prospects on landing pages |
| **Goal** | Efficiency — complete tasks quickly with minimal clicks | Conversion — guide users toward booking, signup, or purchase |
| **Information density** | High — data tables, multi-column layouts, compact controls, dashboards with many widgets visible simultaneously | Low — one primary CTA per view, generous whitespace, focused user journey |
| **Visual tone** | Neutral, professional, tool-like — comparable to Linear, Notion, or Vercel Dashboard | Branded, warm, trustworthy — comparable to Cal.com, Calendly, or Stripe's marketing pages |
| **Typography** | Smaller base size (14px), tighter line heights, monospace for data | Larger base size (16-18px), generous line heights, display fonts for headings |
| **Spacing** | Compact — `gap-2`, `p-3`, `py-1.5` for dense information | Spacious — `gap-6`, `p-8`, `py-16` for breathing room |
| **Color palette** | Muted, low-saturation — reduce visual fatigue during long sessions | High-contrast accents, brand colors — draw attention to CTAs |
| **Motion** | Minimal — instant transitions, no decorative animations | Purposeful — subtle entrance animations, scroll-triggered reveals |
| **Navigation** | Sidebar + Command Palette — power-user oriented, keyboard-first | Top navigation + breadcrumbs — discovery-oriented, mobile-first |

### Technical Implementation

The key insight: **shared components, divergent themes**. Both apps import from `@arbeidskassen/ui`, but each app wraps those components in its own CSS variable context.

#### Layer 1: Shared Component Library (`packages/ui`)

All structural components live in `packages/ui`. These components are **theme-agnostic** — they reference CSS variables, never hardcoded colors or spacing tokens.

```tsx
// packages/ui/src/components/Button.tsx
import { cn } from "../lib/utils";

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "bg-primary text-primary-foreground",      // ← CSS variables, not colors
        "hover:bg-primary/90",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,                                   // ← App can override via className
      )}
      {...props}
    />
  );
}
```

The `Button` component looks different in Admin vs Public contexts because `--primary`, `--primary-foreground`, and `--ring` resolve to different values.

#### Layer 2: App-Specific CSS Variables

Each app defines its own `globals.css` that overrides the base theme from `packages/ui`:

```css
/* apps/arbeidskassen/app/globals.css — Admin Theme */
@import "tailwindcss";
@import "@arbeidskassen/ui/globals.css";

@layer base {
  :root {
    /* Neutral, low-saturation palette for tool-like efficiency */
    --primary: 0 0% 9%;                /* Near-black */
    --primary-foreground: 0 0% 98%;    /* Near-white */
    --radius: 0.375rem;                /* Smaller radius for compact feel */

    /* Admin-specific tokens */
    --sidebar-width: 240px;
    --header-height: 48px;
  }
}
```

```css
/* apps/bookdet/app/globals.css — Public Theme */
@import "tailwindcss";
@import "@arbeidskassen/ui/globals.css";

@layer base {
  :root {
    /* Warm, branded palette for trust and conversion */
    --primary: 221 83% 53%;            /* Vibrant blue */
    --primary-foreground: 0 0% 100%;   /* Pure white */
    --radius: 0.75rem;                 /* Larger radius for friendly feel */

    /* Public-specific tokens */
    --hero-max-width: 1200px;
    --section-padding: 4rem;
  }
}
```

#### Layer 3: App-Specific Layout Components

While atomic components (Button, Input, Card, Badge) are shared, **layout shells are app-specific**:

```
packages/ui/src/components/        # Shared: Button, Input, Card, Dialog, Table, Badge, etc.
apps/arbeidskassen/src/components/ # Admin-only: Sidebar, DashboardGrid, DataTable toolbar
apps/bookdet/src/components/       # Public-only: HeroSection, FeatureGrid, TestimonialCarousel
```

This separation ensures that:
- Admin-specific layout code (sidebar, dense grids) is never shipped to public pages.
- Public-specific marketing components (hero sections, testimonials) are never shipped to the admin panel.
- Shared primitives stay truly shared and theme-agnostic.

#### Layer 4: Contextual Spacing Utilities

For components that need density-aware spacing, we use a CSS variable-based approach:

```css
/* packages/ui/src/globals.css */
:root {
  --density-spacing: 1rem;         /* Default: normal */
}

.density-compact {
  --density-spacing: 0.5rem;       /* Admin: tight */
}

.density-spacious {
  --density-spacing: 1.5rem;       /* Public: generous */
}
```

```tsx
// apps/arbeidskassen/app/layout.tsx
<body className="density-compact">

// apps/bookdet/app/(public)/layout.tsx
<body className="density-spacious">
```

Shared components that use `gap-[var(--density-spacing)]` or `p-[var(--density-spacing)]` automatically adapt to their context.

### Decision Framework

When adding a new component, ask:

| Question | If Yes → | If No → |
| --- | --- | --- |
| Is this a primitive UI element (button, input, card, dialog)? | Add to `packages/ui` | — |
| Is this used by more than one app? | Add to `packages/ui` | Keep in the consuming app |
| Does it contain app-specific layout logic (sidebar, hero)? | Keep in the app | — |
| Does it use hardcoded colors or spacing? | Refactor to CSS variables first | Ready for `packages/ui` |
| Does it look identical across Admin and Public contexts? | Safe to share as-is | Share the structure, theme via CSS variables |
