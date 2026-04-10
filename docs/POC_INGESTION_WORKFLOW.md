# POC Ingestion Workflow

> How to bridge rapid prototypes built in external AI tools into our strict production monorepo — without importing their technical debt.

---

## Table of Contents

- [Overview](#overview)
- [The Workflow](#the-workflow)
- [Refactoring Standards](#refactoring-standards)
- [Component Mapping](#component-mapping)
- [Data Layer Rewrite](#data-layer-rewrite)
- [Checklist](#checklist)

---

## Overview

External AI tools (v0, Bolt, Lovable, Claude Artifacts, ChatGPT Canvas, etc.) are excellent for rapid visual prototyping. They produce working React/HTML mockups in minutes. However, their output **never** meets our production standards:

- Hardcoded state instead of server-fetched data
- Generic Tailwind classes instead of our CSS variable-backed design tokens
- No authentication, authorization, or RLS awareness
- Missing or incorrect ARIA attributes
- Default exports, `any` types, inline styles
- No multi-tenant isolation

The `_poc-imports/` folder and this workflow exist to capture the **visual intent and business logic** from prototypes while discarding everything else.

---

## The Workflow

### Step 1: Drop Raw Code

Place the prototype output into a dedicated subfolder under `_poc-imports/`:

```
_poc-imports/
└── shift-planner/
    ├── NOTES.md          # What it does, target app, target route
    ├── ShiftBoard.tsx     # Raw component from external tool
    ├── ShiftCard.tsx
    └── mockData.ts        # Fake data used in the prototype
```

The `NOTES.md` file must include:

| Field | Example |
| --- | --- |
| **Source tool** | v0.dev |
| **Target app** | `apps/today` |
| **Target route** | `(dashboard)/shifts/page.tsx` |
| **Intent** | Weekly shift planner with drag-and-drop, color-coded by department |
| **What to keep** | Layout structure, drag interaction pattern, card visual design |
| **What to discard** | Fake employee data, hardcoded colors, inline event handlers |

### Step 2: Analyze the Prototype

Before writing any production code, read the prototype and identify:

1. **Visual layout** — grid structure, spacing, responsive breakpoints.
2. **Business logic intent** — what data is displayed, what interactions are supported.
3. **Component decomposition** — how the UI is split into reusable pieces.
4. **Missing concerns** — what the prototype ignores (auth, RLS, loading states, error boundaries, accessibility).

### Step 3: Rewrite into Production

Create the production version in the target app. The prototype is **read-only reference material** — never copy-paste code from `_poc-imports/` into `apps/` or `packages/`.

The rewrite must:

1. Use Server Components by default; add `"use client"` only where interactivity requires it.
2. Fetch data via `createServerClient()` with RLS-enforced queries.
3. Use `packages/ui` (shadcn/ui) components instead of raw HTML/Tailwind recreations.
4. Apply CSS variable-backed semantic classes (`bg-primary`, `text-muted-foreground`) instead of hardcoded colors.
5. Add proper TypeScript types — no `any`, no loose props.
6. Implement WCAG 2.1 AA compliance (labels, ARIA, focus management, semantic HTML).
7. Follow the Server Action pattern for all mutations (authenticate → validate → authorize → mutate → revalidate).
8. Add loading states (`loading.tsx` or `<Suspense>`) and error boundaries (`error.tsx`).

### Step 4: Clean Up

Once the production version is merged, **delete the subfolder** from `_poc-imports/`. Stale prototypes create confusion.

---

## Refactoring Standards

External prototype code typically violates our standards in predictable ways. Here is what to expect and how to fix it:

### State Management

| Prototype Pattern | Production Replacement |
| --- | --- |
| `useState` with hardcoded initial data | Server Component with `createServerClient()` fetch |
| `useEffect` for data fetching | Server Component async data fetching (no useEffect needed) |
| Local `mockData.ts` arrays | Supabase query with RLS filtering by `tenant_id` |
| `localStorage` for persistence | Supabase database with proper schema |
| Global state via Context for shared data | Server-side data fetching passed as props; Supabase Realtime for live updates |

### Styling

| Prototype Pattern | Production Replacement |
| --- | --- |
| `bg-blue-500`, `text-red-600` | `bg-primary`, `text-destructive` (CSS variable-backed) |
| `className="text-[#FF6B35]"` | Add to theme via CSS custom properties if new semantic color needed |
| Inline `style={{ }}` attributes | Tailwind utility classes or CSS variables |
| Custom CSS files | Tailwind utilities; custom CSS only as absolute last resort |
| `px-4 py-2 rounded-md border` on a button | `<Button>` from `@arbeidskassen/ui` |
| Hardcoded `dark:` variants | Handled automatically by CSS variables and `next-themes` |

### Accessibility

| Prototype Pattern | Production Replacement |
| --- | --- |
| `<div onClick={...}>` | `<button>` or `<Button>` from `@arbeidskassen/ui` |
| `<span onClick={...}>` for links | `<a href>` or `<Link>` from Next.js |
| No `aria-label` on icon buttons | Add descriptive `aria-label` (Norwegian for user-facing UI) |
| Missing form `<label>` elements | Add associated `<label>` for every input |
| `<img>` without `alt` | Add descriptive `alt` text (or `alt=""` with `role="presentation"`) |
| Heading level skips (`<h1>` → `<h3>`) | Use sequential heading levels |
| Color-only status indicators | Pair with text, icons, or patterns |
| Decorative animations | Wrap in `prefers-reduced-motion` media query |

### TypeScript

| Prototype Pattern | Production Replacement |
| --- | --- |
| `any` types | `unknown` with type guards, or proper interfaces |
| Untyped props (`props: any`) | Explicit `interface` or `type` for all component props |
| Default exports | Named exports (except Next.js page/layout) |
| Inline type assertions (`as string`) | Zod validation at system boundaries |
| No return types on functions | Explicit return types on exported functions |

---

## Component Mapping

External tools generate raw HTML/Tailwind that often reinvents components we already have in `packages/ui`. Always map to our existing primitives:

| Raw Prototype Element | Use Instead (`@arbeidskassen/ui`) |
| --- | --- |
| Custom modal with backdrop div | `<Dialog>` (Radix-based) |
| Hand-rolled dropdown menu | `<DropdownMenu>` (Radix-based) |
| `<input>` + custom validation | `<Input>` + Zod schema |
| Tab switcher with state | `<Tabs>` (Radix-based) |
| Toast notification with setTimeout | `<Sonner>` or `<Toast>` |
| Table with `<tr>/<td>` | `<Table>` + `<DataTable>` with sorting/filtering |
| Custom date picker | `<DatePicker>` (if available) or `<Popover>` + `<Calendar>` |
| Accordion / collapsible sections | `<Accordion>` (Radix-based) |
| Toggle / switch | `<Switch>` (Radix-based) |
| Tooltip on hover | `<Tooltip>` (Radix-based) |
| Sidebar navigation | App-specific layout component (not from `packages/ui`) |
| Card with shadow and border | `<Card>` |
| Badge / chip / tag | `<Badge>` |
| Command palette / search | `<Command>` (cmdk-based) |
| Select / combobox | `<Select>` or `<Combobox>` (Radix-based) |
| Alert / banner | `<Alert>` |
| Form layout | `<Form>` with react-hook-form + Zod |

If a component doesn't exist in `packages/ui` yet and is needed by multiple apps, add it to `packages/ui` using the shadcn/ui CLI. Never duplicate components across apps.

---

## Data Layer Rewrite

The most critical transformation: prototypes use fake data; production uses authenticated, tenant-scoped, RLS-protected queries.

### Before (Prototype)

```tsx
"use client";
import { useState } from "react";

const mockShifts = [
  { id: 1, employee: "Ola Nordmann", start: "08:00", end: "16:00" },
  { id: 2, employee: "Kari Hansen", start: "10:00", end: "18:00" },
];

export default function ShiftBoard() {
  const [shifts, setShifts] = useState(mockShifts);
  return (
    <div className="grid grid-cols-7 gap-2">
      {shifts.map((s) => (
        <div key={s.id} className="bg-blue-100 p-2 rounded">
          <p className="font-bold">{s.employee}</p>
          <p className="text-sm text-gray-500">{s.start} – {s.end}</p>
        </div>
      ))}
    </div>
  );
}
```

### After (Production)

```tsx
// app/(dashboard)/shifts/page.tsx — Server Component
import { createServerClient } from "@arbeidskassen/supabase/server";
import { Card, CardContent } from "@arbeidskassen/ui";

export default async function ShiftsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS automatically filters by tenant_id
  const { data: shifts } = await supabase
    .from("shifts")
    .select("id, start_time, end_time, employee:profiles(full_name)")
    .order("start_time");

  return (
    <div className="grid grid-cols-7 gap-2">
      {shifts?.map((shift) => (
        <Card key={shift.id}>
          <CardContent className="p-2">
            <p className="font-bold">{shift.employee.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {shift.start_time} – {shift.end_time}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

Key differences:
- Server Component (no `"use client"`, no `useState`)
- Authenticated via `getUser()`
- Data from Supabase with RLS (not mock arrays)
- `Card` from `packages/ui` (not raw div)
- `text-muted-foreground` (not `text-gray-500`)

---

## Checklist

Before marking a POC integration as complete, verify every item:

- [ ] No code was copy-pasted from `_poc-imports/` — all production code was rewritten
- [ ] Server Components used by default; `"use client"` only where necessary
- [ ] All data fetched via `createServerClient()` with RLS enforcement
- [ ] All mutations go through Server Actions (authenticate → validate → authorize → mutate → revalidate)
- [ ] All UI uses `packages/ui` components — no raw HTML recreations of existing primitives
- [ ] All colors use CSS variable-backed semantic classes — no hardcoded Tailwind colors
- [ ] All text uses Norwegian (Bokmål) for user-facing content, English for code
- [ ] TypeScript strict — no `any`, explicit types on all props and returns
- [ ] WCAG 2.1 AA — semantic HTML, labels, ARIA, focus indicators, color contrast
- [ ] Loading states (`loading.tsx` / `<Suspense>`) and error boundaries (`error.tsx`) added
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] `_poc-imports/` subfolder deleted after successful integration
