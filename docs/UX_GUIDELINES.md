# Arbeidskassen UX & UI Guidelines

> This document defines the ultimate user experience (UX) and user interface (UI) principles for Arbeidskassen. It is written specifically for developers and AI agents (like Codex, Copilot, Cursor) to ensure consistency, accessibility, and high quality across all features.

## 1. Core Philosophy

Arbeidskassen is a professional tool. The UX should feel **fast, contextual, and unobtrusive**, drawing inspiration from modern minimalist workspaces (like Linear, Milanote, and Google Workspace).

*   **Keyboard First:** Power users must be able to use the application without a mouse.
*   **Contextual UI:** Only show what is relevant to the current module (`appName`). Avoid global clutter. 
*   **Accessible by Default:** We strictly adhere to WCAG 2.1 AA. Never invent custom interactive elements when a primitive exists.

## 2. Components & Accessibility (Radix & shadcn/ui)

Do **NOT** create custom dropdowns, modals, or popovers using `useState` and `div` elements. AI agents often default to building custom `onClickOutside` handlers. **This is strictly forbidden.** 

Always use `@radix-ui/react-*` primitives (via shadcn/ui) for:
*   `DropdownMenu`
*   `Popover`
*   `Dialog` (Modals)
*   `Select`
*   `Tabs`

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

## 7. Workflow: Adding New Components (SOP)

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
