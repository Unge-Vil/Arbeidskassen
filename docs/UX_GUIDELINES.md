# Arbeidskassen UX & UI Guidelines

> This document defines the ultimate user experience (UX) and user interface (UI) principles for Arbeidskassen. It is written specifically for developers and AI agents (like Codex, Copilot, Cursor) to ensure consistency, accessibility, and high quality across all features.

## 1. Core Philosophy

Arbeidskassen is a professional workspace tool. The UX should feel **breathable, card-based, friendly, and contextual**, inspired by modern workspace platforms like monday.com and Notion.

*   **Breathable by Default:** Favor generous but readable layouts. Standard interface text defaults to **`14px`** with `line-height: 1.5`. Use `p-5` / `p-6` / `gap-4` as standard spacing. Density can be reduced explicitly with the `density-compact` utility class for tables and data-heavy views.
*   **Card-Based Canvas:** The workspace uses white cards (`--ak-bg-card`) on a light gray canvas (`--ak-bg-main`) with subtle shadows (`shadow-sm`). Each settings section, content block, or module panel is its own card with `rounded-xl` corners.
*   **Labels as Helpers:** Form labels default to **`13px`**, **medium weight**, **normal-case** with standard letter-spacing. They guide the user without shouting.
*   **Tactile Interactions:** Interactive controls should feel responsive. Use visible surfaces, subtle borders, and optional feedback such as `active:scale-[0.98]` on buttons.
*   **Keyboard First:** Power users must be able to use the application without a mouse.
*   **Contextual UI:** Only show what is relevant to the current module (`appName`). Avoid global clutter.
*   **Accessible by Default:** We strictly adhere to WCAG 2.1 AA. Every focus state must be clearly visible, icon-only controls need `aria-label`s, and effective hit targets must remain at least `44px` through padding or layout.

## 2. Components & Accessibility (Radix & shadcn/ui)

Do **NOT** create custom dropdowns, modals, or popovers using `useState` and `div` elements. AI agents often default to building custom `onClickOutside` handlers. **This is strictly forbidden.**

Always use `@radix-ui/react-*` primitives (via shadcn/ui) for:
*   `DropdownMenu`
*   `Popover`
*   `Dialog` (Modals)
*   `Select`
*   `Tabs`

Shared components must reflect the Arbeidskassen breathable system:
*   Buttons use `rounded-lg` corners with responsive sizing (`min-h-11`) and `text-[14px]`. Small buttons use `text-[13px]`.
*   Cards and settings sections use `rounded-xl` corners, `shadow-sm`, generous padding (`p-5`/`p-6`), and `bg-[var(--ak-bg-card)]` on the canvas background.
*   Inputs and selects use `rounded-lg`, `text-[14px]`, and consistent `min-h-11` height.
*   Focus treatments must be crisp and theme-token-driven, using the platform ring color (`--ak-ring`) rather than hardcoded Tailwind colors.
*   Preserve all Radix semantics and accessibility behavior — never trade keyboard support or ARIA correctness for custom styling.
*   Use `<SelectNative>` from `@arbeidskassen/ui` for native HTML select elements instead of inline styled `<select>` tags.
*   Use `<PageHeader>` from `@arbeidskassen/ui` for all settings/admin pages that need a category label + title + description header.

**Why?** Radix handles focus trapping, `Escape` key listeners, and ARIA labels out of the box.

## 3. Global CSS Variables & Theming

Never use hardcoded Tailwind colors like `bg-gray-100` or `text-blue-500` for structural UI. 
Always use the platform tokens defined in `packages/ui/src/globals.css`:

*   `bg-[var(--ak-bg-main)]` - App background
*   `bg-[var(--ak-bg-panel)]` - Panel / Sidebar / Navbar background
*   `bg-[var(--ak-bg-card)]` - Floating cards and popovers
*   `bg-[var(--ak-bg-hover)]` - Hover states on interactable elements
*   `border-[var(--ak-border-soft)]` - Soft dividers
*   `text-[var(--ak-text-main)]` - Primary contrast text
*   `text-[var(--ak-text-muted)]` - Secondary / descriptive text
*   `text-[var(--ak-accent)]` - Primary brand color (interactive)

## 4. Keyboard Shortcuts

Vital actions should always have a shortcut.
*   **Global Search:** `CMD + K` (Mac) or `CTRL + K` (Windows). 
*   **Close Overlays:** `Escape`.
*   **Focus visibility:** Ensure `outline-none focus-visible:ring-2 focus-visible:ring-ring` is applied to all buttons and inputs.

## 5. Context-Aware Design

*   When a user clicks "Search" (or `CMD+K`), the placeholder should reflect the context they are in (`"Søk i [Arbeidskassen] eller globalt..."`).
*   The top-left of the Navbar always reflects the active `appName`.

## 6. Animations (tailwindcss-animate)

UI transitions should be snappy (max 200ms) but smooth. For popovers, dropdowns, and modals, use Radix data states and tailwindcss-animate:
```css
/* Example standard pop-in animation */
className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-[5%] duration-200"
```
When closing:
```css
className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
```

## 7. Status Colors

Arbeidskassen uses dedicated semantic status tokens for task/item states. Never hardcode status colors.

| Status | Token | Use |
|--------|-------|-----|
| Working on it | `--ak-status-working` (yellow) + `--ak-status-working-bg` | Active tasks |
| Stuck | `--ak-status-stuck` (red) + `--ak-status-stuck-bg` | Blocked items |
| Done | `--ak-status-done` (green) + `--ak-status-done-bg` | Completed items |
| Blank/Unset | `--ak-status-blank` (gray) + `--ak-status-blank-bg` | No status assigned |

Use the `<StatusBadge>` component from `@arbeidskassen/ui` for rendering status pills:
```tsx
<StatusBadge variant="working" label="Working on it" />
<StatusBadge variant="stuck" label="Stuck" />
<StatusBadge variant="done" label="Done" />
```

## 8. Settings Page Pattern

All settings and administration pages (Profile, Organization/Virksomhet, Structure, etc.) follow a consistent layout.

### 8A. Standard settings page

Use this pattern when a page needs richer context, helper panels, or multiple sections:

1.  **`<PageHeader>`** at the top with `category`, `title`, and optional `description`.
2.  **Two-column grid** on wide screens: `grid xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]` — form on the left, sidebar info on the right.
3.  **Section cards** use `rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-6 shadow-sm sm:p-7` with `mb-6` heading spacing inside.
4.  **Inner form grids** use `gap-5` for comfortable field spacing.
5.  **Alert banners** (success, error, warning) use `rounded-xl` and semantic color tokens.

### 8B. Left-sidebar settings shell

Use this pattern for app-level settings areas where many pages share the same navigation, such as `Organisasjon`, `Backoffice`, or future admin modules.

1.  **Sidebar is flush left and full height** under the top navbar. It should be a dedicated left column, visually attached to the page edge.
2.  **Sidebar width:** around `220px–248px` on desktop. Keep it narrow and simple.
3.  **Sidebar surface:** use a subtle app-shell background like `bg-[var(--ak-bg-panel)]` or a very light neutral surface with a right border.
4.  **Navigation items:** one vertical list, one active item at a time. Active item uses the primary accent background with strong contrast.
5.  **Content area:** scrolls independently from the sidebar. The content container can still be centered with a readable `max-w-*`.
6.  **Do not add unnecessary landing pages** for settings modules. The first real settings page should usually be the default route.
7.  **Use the same card style across all subpages** inside the settings module so `Virksomhet`, `Brukere`, `Struktur`, `Fakturering`, and `Audit logg` feel like one system.

### 8C. Simple settings card variant

When the desired UI is closer to a clean admin form (like the current `Virksomhet` reference), prefer:

- one primary white card with a light border
- a header row inside the card (`title` + short helper text)
- straightforward form rows and minimal extra chrome
- one clear primary action aligned to the bottom right
- no decorative side widgets unless they add real value

## 9. Workflow: Adding New Components (SOP)

To maintain a robust, stable, and highly accessible design system across the monorepo, follow this Standard Operating Procedure (SOP) when adding new UX/UI components:

1. **Radix/shadcn First:** Never invent custom interactive primitives (dropdowns, selects, popovers) with `useState` and `div`s. Always use `@radix-ui/react-*` via shadcn/ui. Run `npx shadcn@latest add <component>` inside `packages/ui`.
2. **Centralized Placement:** Shared components (buttons, lists, inputs, complex structural UI) must *always* live in `packages/ui/src/components/ui/` or `packages/ui/src/components/layout/`. Do not create local components for these inside `apps/*` unless they contain ultra-specific business logic.
3. **Theming Guardrails (Critical):** Manually inspect the newly added component. Replace all standard Tailwind color utilities (e.g., `bg-primary`, `text-muted-foreground`, `bg-popover`) with the platform's custom `--ak-*` design tokens:
   - Change `bg-primary` to `bg-[var(--ak-accent)]`
   - Change `text-muted-foreground` to `text-[var(--ak-text-muted)]`
   - Change `bg-popover` to `bg-[var(--ak-bg-card)]`
   - Change `bg-background` to `bg-[var(--ak-bg-main)]`
   This ensures immediate compliance with all themes (Light, Dark, Night/Dashboard).
4. **A11y Verification:** Verify the component against physical keyboard navigation (Tab, Esc, Enter, Arrow Keys) and `@axe-core/react` runtime warnings (check for missing `aria-label`s on icon buttons).
5. **Export:** Make sure to export the component from `packages/ui/src/index.ts` so `apps/*` can consume it cleanly: `import { Button } from "@arbeidskassen/ui";`.
