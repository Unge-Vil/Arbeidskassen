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

> **Architecture note:** All modules have been consolidated into a single Next.js app (`apps/arbeidskassen`). Modules are route groups under `app/(authenticated)/`. There are no separate apps, ports, or proxy rewrites. Locale is resolved from cookie/header — no `[locale]` URL segment.

### Single App Structure

```
apps/arbeidskassen/app/
├── layout.tsx                        # Root layout (html, body, ThemeProvider, NextIntlClientProvider)
├── error.tsx                         # Global error boundary
├── not-found.tsx                     # 404 page
├── login/page.tsx                    # Shared authentication
├── select-tenant/page.tsx            # Tenant selection
│
├── (authenticated)/
│   ├── layout.tsx                    # Suspense boundary + AuthenticatedLayoutContent
│   ├── authenticated-layout-content.tsx  # Auth guard + Navbar + shell context
│   ├── authenticated-shell-skeleton.tsx  # Skeleton shown during auth loading
│   ├── dashboard-overlay-client.tsx      # Lazy-loaded DashboardOverlay (ssr: false)
│   │
│   ├── dashboard/                    # Dashboard with widget grid
│   │   ├── page.tsx                  # force-dynamic, lazy-loads DashboardGrid
│   │   ├── dashboard-grid-client.tsx # Client wrapper for DashboardGrid (ssr: false)
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── profil/                       # Profile settings
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── bookdet/                      # Booking module
│   │   ├── layout.tsx                # BookDet sidebar shell
│   │   ├── loading.tsx / error.tsx
│   │   ├── oversikt/
│   │   ├── sok-book/
│   │   ├── mine-bookinger/
│   │   ├── bookinger/
│   │   ├── ressurser/
│   │   ├── sjekklister/
│   │   └── innstillinger/           # Each sub-route has own loading.tsx + error.tsx
│   │
│   ├── organisasjon/                 # Core organization module
│   │   ├── layout.tsx                # Organization sidebar shell
│   │   ├── loading.tsx / error.tsx
│   │   ├── virksomhet/
│   │   ├── brukere/
│   │   ├── roller/
│   │   ├── struktur/
│   │   ├── fakturering/
│   │   └── audit-logg/              # Each sub-route has own loading.tsx + error.tsx
│   │
│   ├── teamarea/                     # Collaboration feed
│   │   ├── layout.tsx                # TeamArea shell with Suspense
│   │   ├── loading.tsx / error.tsx
│   │   └── page.tsx
│   │
│   ├── today/                        # Daily operations
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   ├── backoffice/                   # Platform admin dashboard
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   └── sales-portal/                 # Sales & partner portal
│       ├── page.tsx
│       ├── loading.tsx
│       └── error.tsx
│
├── (public)/                         # Future: public BookDet pages
│   └── book/[slug]/page.tsx
│
└── actions/                          # Server Actions
    ├── auth.ts
    ├── profile.ts
    ├── dashboard.ts
    ├── tenant.ts
    ├── members.ts
    ├── roles.ts
    └── structure.ts
```

### Module Details

**BookDet** — Full-featured appointment and resource booking system. Route group: `(authenticated)/bookdet/`. Has its own sidebar shell and 7 sub-pages. See [docs/CONSOLIDATION_PLAN.md](../docs/CONSOLIDATION_PLAN.md) for migration details.

**Organisasjon** — Source of Truth for organizational identity, hierarchy, and user governance. Route group: `(authenticated)/organisasjon/`. Has its own sidebar shell and 6 sub-pages. See [docs/CORE_ORGANIZATION_MODULE.md](../docs/CORE_ORGANIZATION_MODULE.md).

**TeamArea** — Collaboration-focused feed for announcements and cross-team communication. Route group: `(authenticated)/teamarea/`. Preview feed shell.

**Today** — Daily operations workspace. Currently a placeholder. Route: `(authenticated)/today/page.tsx`.

**Backoffice** — Platform owner administration. Strict GDPR data isolation. Route: `(authenticated)/backoffice/page.tsx`. See [docs/SUPERADMIN_AND_SUPPORT.md](../docs/SUPERADMIN_AND_SUPPORT.md).

**Sales Portal** — Partner-facing interface for sales partners. Route: `(authenticated)/sales-portal/page.tsx`. See [docs/SALES_AND_PARTNERS.md](../docs/SALES_AND_PARTNERS.md).

### Middleware

A single `middleware.ts` at the app root handles all route protection. Protected prefixes include `/dashboard`, `/bookdet`, `/organisasjon`, `/teamarea`, `/today`, `/backoffice`, and `/sales-portal`. No `APP_AUTH_POLICIES` lookup — just an inline list of protected prefixes.

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
/* Admin Theme — CSS variable overrides */
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

Future public-facing pages (e.g., BookDet booking pages at `(public)/book/[slug]`) will use a separate layout with a branded, spacious theme via CSS variable overrides.

#### Layer 3: App-Specific Layout Components

While atomic components (Button, Input, Card, Badge) are shared, **module layout shells are colocated with their route groups**:

```
packages/ui/src/components/                                 # Shared: Button, Input, Card, Dialog, Table, Badge, etc.
apps/arbeidskassen/app/(authenticated)/layout.tsx            # Suspense boundary + auth guard + Navbar
apps/arbeidskassen/app/(authenticated)/bookdet/              # BookDet sidebar shell + pages
apps/arbeidskassen/app/(authenticated)/organisasjon/         # Organization sidebar shell + pages
apps/arbeidskassen/app/(authenticated)/teamarea/             # TeamArea sidebar shell + pages
```

This separation ensures that:
- Module-specific layout code (sidebars, shells) lives next to the pages it serves.
- Shared primitives stay truly shared and theme-agnostic.
- Future public-facing pages (BookDet booking pages) can use a different layout shell without affecting admin views.

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

// Future: apps/arbeidskassen/app/(public)/layout.tsx
<div className="density-spacious">
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
