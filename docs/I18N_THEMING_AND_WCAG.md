# Internationalization, Theming & WCAG Accessibility

> How Arbeidskassen delivers a multi-language, theme-aware, and fully accessible experience — required for Norwegian public sector contracts and international expansion.

---

## Table of Contents

- [Internationalization (i18n)](#internationalization-i18n)
- [Theming](#theming)
- [Accessibility (WCAG 2.1 AA)](#accessibility-wcag-21-aa)
- [Testing & Compliance Verification](#testing--compliance-verification)

---

## Internationalization (i18n)

### Strategy

Arbeidskassen uses [`next-intl`](https://next-intl.dev/) for all internationalization within the Next.js App Router. Translation is handled via message files (JSON), loaded per-locale at the layout level.

### Supported Locales

| Code | Language | Status |
| --- | --- | --- |
| `no` | Norwegian Bokmål | Primary (default) |
| `en` | English | Required for international customers |
| `sv` | Swedish | Planned (Phase 3) |
| `da` | Danish | Planned (Phase 3) |

### Which Modules Require i18n

| Module / Surface | i18n Required | Reason |
| --- | --- | --- |
| **BookDet (public booking pages)** | **Yes — from day one** | Customer-facing, may serve non-Norwegian speakers |
| **Admin Panel (dashboard)** | Yes (Phase 2) | Internal users initially Norwegian, but needed for international expansion |
| **Free Tools** | Yes (Phase 2) | SEO value in multiple languages, but Norwegian-first for launch |
| **System emails / notifications** | **Yes — from day one** | Must render in the recipient's preferred locale |
| **Error messages (user-facing)** | **Yes — from day one** | Part of WCAG and UU (universell utforming) compliance |

### Architecture

#### File Structure

All i18n configuration and messages are consolidated in the single app:

```
apps/arbeidskassen/
├── messages/
│   ├── no.json          # Norwegian Bokmål (default) — all modules
│   ├── en.json          # English — all modules
│   ├── sv.json          # Swedish (future)
│   └── da.json          # Danish (future)
├── app/
│   └── [locale]/        # Dynamic locale segment
│       ├── layout.tsx   # NextIntlClientProvider wraps children
│       └── ...
└── i18n/
    ├── request.ts       # getRequestConfig — resolves locale from URL/cookie
    └── routing.ts       # Locale routing configuration
```

Message keys are namespace-prefixed per module (e.g., `bookdetShell`, `bookdetPages`, `teamareaShell`, `organizationShell`) to avoid collisions. The `common` namespace contains shared keys.

#### Message File Format

```json
// messages/no.json
{
  "booking": {
    "title": "Bestill time",
    "submit": "Bekreft bestilling",
    "cancel": "Avbryt",
    "success": "Bestillingen er bekreftet!",
    "error": {
      "unavailable": "Tidspunktet er ikke tilgjengelig",
      "past": "Du kan ikke bestille i fortiden"
    }
  },
  "common": {
    "loading": "Laster...",
    "save": "Lagre",
    "delete": "Slett",
    "back": "Tilbake"
  }
}
```

```json
// messages/en.json
{
  "booking": {
    "title": "Book appointment",
    "submit": "Confirm booking",
    "cancel": "Cancel",
    "success": "Booking confirmed!",
    "error": {
      "unavailable": "This time slot is not available",
      "past": "You cannot book in the past"
    }
  },
  "common": {
    "loading": "Loading...",
    "save": "Save",
    "delete": "Delete",
    "back": "Back"
  }
}
```

#### Usage in Components

**Server Components:**

```typescript
import { getTranslations } from "next-intl/server";

export default async function BookingPage() {
  const t = await getTranslations("booking");

  return (
    <main>
      <h1>{t("title")}</h1>
      {/* ... */}
    </main>
  );
}
```

**Client Components:**

```typescript
"use client";

import { useTranslations } from "next-intl";

export function BookingForm() {
  const t = useTranslations("booking");

  return (
    <form>
      {/* ... */}
      <button type="submit">{t("submit")}</button>
    </form>
  );
}
```

### i18n Rules

1. **Never hardcode user-facing text** in public-facing modules (BookDet, emails, notifications). Always use translation keys.
2. **Admin panel** may start with hardcoded Norwegian text for speed, but must be refactored to `next-intl` before Phase 2 launch.
3. **Free tools** follow the same rule as admin panel — Norwegian-first, i18n-ready structure.
4. **Translation keys** use dot-notation namespaces: `{module}.{section}.{key}` (e.g., `booking.error.unavailable`).
5. **Pluralization and formatting** use `next-intl`'s ICU MessageFormat support — never build plural logic manually.
6. **Date and number formatting** use `next-intl`'s `useFormatter()` or `format.dateTime()` — never hardcode date formats.

---

## Theming

### Strategy

Arbeidskassen uses [`next-themes`](https://github.com/pauldotknopf/next-themes) for theme switching and CSS custom properties (variables) defined in `packages/ui/src/globals.css` for all color values. This is the standard approach recommended by shadcn/ui.

### Theme Modes

| Theme | Description | Implementation |
| --- | --- | --- |
| **Light** | Default. Clean, high-contrast for professional use. | `:root` CSS variables |
| **Dark** | Reduced eye strain. Important for field workers using tablets in low light. | `.dark` class on `<html>` |
| **System** | Follows the user's OS preference. | `next-themes` with `attribute="class"` and `defaultTheme="system"` |

### How It Works

#### 1. CSS Variables (packages/ui/src/globals.css)

All colors are defined as HSL values in CSS custom properties. Components reference these variables through Tailwind's semantic classes, never raw color values.

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --destructive: 0 84.2% 60.2%;
    /* ... full palette */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 62.8% 30.6%;
    /* ... full palette */
  }
}
```

#### 2. Theme Provider & Global CSS Import (root layout)

> **CRITICAL RULE**: The root layout must ALWAYS import the global CSS from the UI package to correctly inject the CSS custom properties needed for the design system and dashboard widgets.

```typescript
// app/layout.tsx
import { ThemeProvider } from "next-themes";
import "@arbeidskassen/ui/globals.css"; // MUST use this instead of "./globals.css"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### 3. Theme Toggle Component

```typescript
"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  // Renders a button that cycles through light → dark → system
}
```

### Custom Themes (Easter Eggs & Tenant Branding)

Beyond Light and Dark, Arbeidskassen supports custom themes by swapping CSS variable sets on the `<html>` element.

#### Easter Egg Themes

Fun, hidden themes activated through the Command Palette or special key sequences:

| Theme | Trigger | Description |
| --- | --- | --- |
| `retro` | Type "retro" in Command Palette | Amber-on-black terminal aesthetic |
| `nord` | Type "nord" in Command Palette | Nord color palette (blue-gray tones) |
| `solarized` | Type "solarized" in Command Palette | Solarized Light/Dark |

#### Implementation

```css
/* packages/ui/src/themes/retro.css */
.theme-retro {
  --background: 0 0% 0%;
  --foreground: 36 100% 50%;
  --primary: 36 100% 50%;
  --primary-foreground: 0 0% 0%;
  --muted: 0 0% 10%;
  --muted-foreground: 36 50% 40%;
  /* ... */
}
```

```typescript
// Activate by setting the class on <html>
document.documentElement.className = "theme-retro";
// next-themes handles this via setTheme("retro")
```

#### Tenant Branding (Future)

Enterprise tenants can customize their booking pages with brand colors. This is implemented by storing CSS variable overrides in the `tenants` table and injecting them as inline styles on the public booking page layout.

```sql
ALTER TABLE tenants ADD COLUMN theme_overrides JSONB DEFAULT '{}';
-- Example: { "--primary": "210 80% 45%", "--primary-foreground": "0 0% 100%" }
```

### Theming Rules

1. **Never use hardcoded Tailwind colors** like `bg-blue-500`, `text-red-600`, or `border-gray-300`. Always use semantic classes: `bg-primary`, `text-destructive`, `border-border`.
2. **All color values** go through CSS variables defined in `globals.css`.
3. **New shadcn/ui components** automatically respect the theme because they use the variable-backed classes.
4. **Icons and illustrations** must work on both light and dark backgrounds. Use `currentColor` or semantic color classes.
5. **Contrast ratios** must meet WCAG 2.1 AA minimums (4.5:1 for normal text, 3:1 for large text) in all theme variants — including easter egg themes.

---

## Accessibility (WCAG 2.1 AA)

### Compliance Requirement

Arbeidskassen targets **WCAG 2.1 Level AA** compliance. This is a **non-negotiable requirement** driven by:

1. **Norwegian law** — The Equality and Anti-Discrimination Act (Likestillings- og diskrimineringsloven) and the Regulations on Universal Design of ICT (Forskrift om universell utforming av IKT) require all new web solutions targeting the public to meet WCAG 2.1 AA.
2. **Public sector contracts** — Government and municipal customers (kommuner, fylkeskommuner) require WCAG AA compliance in procurement (anskaffelser).
3. **Ethical obligation** — All users, regardless of ability, should have equal access to the platform.

### Foundation: Radix UI Primitives

shadcn/ui is built on [Radix UI](https://www.radix-ui.com/) primitives, which provide:

- **Full keyboard navigation** — Tab, Arrow keys, Enter, Escape, Home, End
- **Screen reader support** — Correct ARIA roles, states, and properties
- **Focus management** — Focus trapping in modals/dialogs, focus restoration on close
- **Type-ahead** — In select/combobox components, typing filters options

By using shadcn/ui components from `@arbeidskassen/ui`, all modules inherit these accessibility features automatically.

### Semantic HTML Rules

| Do | Don't |
| --- | --- |
| `<button onClick={...}>` | `<div onClick={...}>` |
| `<a href="/page">` | `<span onClick={() => router.push(...)}>` |
| `<nav aria-label="Main">` | `<div className="nav">` |
| `<h1>` → `<h2>` → `<h3>` (in order) | Skip heading levels |
| `<table>` with `<thead>`, `<th scope>` | Grid of `<div>`s for tabular data |
| `<input id="x">` + `<label htmlFor="x">` | Placeholder-only inputs with no label |
| `<fieldset>` + `<legend>` for groups | Unrelated inputs in a `<div>` |

### Mandatory ARIA Attributes

#### Icon-Only Buttons

Every button that contains only an icon (no visible text) **must** have a descriptive `aria-label`:

```tsx
// CORRECT
<button aria-label="Lukk dialog" onClick={onClose}>
  <XIcon className="h-4 w-4" />
</button>

// WRONG — screen reader announces "button" with no context
<button onClick={onClose}>
  <XIcon className="h-4 w-4" />
</button>
```

#### Decorative vs Informative Images

```tsx
// Decorative — hide from screen readers
<img src="/pattern.svg" alt="" role="presentation" />

// Informative — describe the content
<img src="/floor-plan.png" alt="Plantegning som viser to kontorer og ett møterom" />
```

#### Live Regions

Dynamic content updates (toast notifications, form validation errors, real-time counters) must use ARIA live regions:

```tsx
// Toast / notification
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>

// Non-critical update (e.g., "3 new bookings")
<div aria-live="polite" aria-atomic="true">
  {t("bookings.newCount", { count: newBookings })}
</div>
```

#### Form Validation

```tsx
<div>
  <label htmlFor="email">E-post</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <p id="email-error" role="alert" className="text-sm text-destructive">
      {errors.email}
    </p>
  )}
</div>
```

### Keyboard Navigation Requirements

| Component | Required Keyboard Support |
| --- | --- |
| **Modals / Dialogs** | Trap focus inside. `Esc` closes. Focus returns to trigger on close. |
| **Dropdowns / Menus** | Arrow keys navigate items. `Enter` selects. `Esc` closes. |
| **Tabs** | Arrow keys switch tabs. `Tab` moves focus out of tab list. |
| **Command Palette** | Arrow keys navigate results. `Enter` selects. `Esc` closes. Typing filters. |
| **Date Picker** | Arrow keys navigate days. `Enter` selects date. `Esc` closes. |
| **Data Tables** | Tab moves between interactive cells. Sort headers are buttons. |
| **Toast / Alerts** | Focus managed automatically. `Esc` dismisses if dismissible. |

All of these are handled by Radix UI primitives when using shadcn/ui components correctly. **Do not build custom implementations** of these patterns — use the existing components from `@arbeidskassen/ui`.

### Color and Contrast

| Requirement | WCAG Criterion | Minimum Ratio |
| --- | --- | --- |
| Normal text (< 18px / < 14px bold) | 1.4.3 Contrast (Minimum) | 4.5:1 |
| Large text (≥ 18px / ≥ 14px bold) | 1.4.3 Contrast (Minimum) | 3:1 |
| UI components and graphical objects | 1.4.11 Non-text Contrast | 3:1 |
| Focus indicators | 1.4.11 Non-text Contrast | 3:1 |

**Rules:**
- Use Tailwind's semantic color classes (`text-foreground`, `bg-muted`, `border-input`) which are mapped to CSS variables designed to meet contrast requirements.
- Never use `text-gray-400` or similar low-contrast utility colors for meaningful content.
- Focus outlines must be visible in both Light and Dark themes. Use `focus-visible:ring-2 focus-visible:ring-ring` (shadcn default).
- Do not convey information through color alone — always pair with text, icons, or patterns.

### Motion and Animations

| Requirement | Implementation |
| --- | --- |
| Users can reduce motion | Respect `prefers-reduced-motion` media query |
| Animations are non-essential | No content or functionality is lost when animations are disabled |
| No flashing content | Never use flashing/strobing effects (WCAG 2.3.1) |

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Testing & Compliance Verification

### Automated Testing

| Tool | Purpose | Integration Point |
| --- | --- | --- |
| **axe-core** (via `@axe-core/react`) | Runtime accessibility violations | Development overlay in dev mode |
| **eslint-plugin-jsx-a11y** | Static analysis of JSX for a11y issues | ESLint (CI pipeline) |
| **Lighthouse CI** | Accessibility audit scoring | CI pipeline (block merge if score < 90) |

### Manual Testing Checklist

Before any feature is merged:

- [ ] Navigate the entire feature using only the keyboard (Tab, Enter, Esc, Arrow keys)
- [ ] Test with a screen reader (NVDA on Windows, VoiceOver on macOS)
- [ ] Verify focus order is logical (left-to-right, top-to-bottom)
- [ ] Verify focus indicators are visible in both Light and Dark themes
- [ ] Check color contrast with browser DevTools or a contrast checker
- [ ] Test with browser zoom at 200% — no content is cut off or overlapping
- [ ] Test with `prefers-reduced-motion: reduce` — no lost functionality
- [ ] Verify all form fields have associated `<label>` elements
- [ ] Verify all images have appropriate `alt` text (or `alt=""` for decorative)
- [ ] Verify all icon-only buttons have `aria-label`

### Accessibility Statement

A public accessibility statement (tilgjengelighetserklæring) will be published at `/tilgjengelighet` on each app, as required by Norwegian regulations. It will document:

- Current WCAG 2.1 AA conformance status
- Known limitations and remediation timeline
- Contact information for reporting accessibility issues
