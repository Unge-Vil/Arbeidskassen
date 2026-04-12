# Design System Oppgradering: Fra Compact til Airy Workspace

> **Dato:** 10. april 2026  
> **Status:** Plan godkjent, klar for implementering  
> **Mål:** Oppgradere Arbeidskassens design system fra "compact Linear-inspirert" til "airy, pustende, card-basert workspace" — inspirert av mockup-referansene.

---

## 1. Hva vi har i dag vs. hva vi vil ha

### Nåværende design ("Compact Pro-Tool")
| Egenskap | Nåverdi |
|----------|---------|
| Body font-size | `13px` |
| Label-stil | `11px`, **bold**, UPPERCASE, wide tracking |
| Card/panel radius | `rounded-3xl` (24px) |
| Card shadow | `shadow-sm` |
| Spacing (padding) | `p-4` / `p-5` — tett |
| Filosofi | "Tactile, compact, fast" (Linear/Milanote) |
| Fargerike elementer | Minimal — primært grå/nøytrale |

### Ønsket design ("Airy Workspace")
| Egenskap | Nyverdi |
|----------|---------|
| Body font-size | `14px` |
| Label-stil | `13px`, **medium**, normal-case, standard tracking |
| Card/panel radius | `rounded-xl` (12px) |
| Card shadow | `shadow-sm` (beholdes — svært subtil) |
| Spacing (padding) | `p-5` / `p-6` — luftig, mer whitespace mellom seksjoner |
| Filosofi | "Breathable, card-based, friendly" (monday.com-aktig workspace) |
| Fargerike elementer | Status-piller (gul, rød, grønn), aktive sidebartabs med blå bakgrunn |

---

## 2. Endringene — Oversikt

```
Fase 1: Fundament (tokens + guidelines)
  ├─ 1A. Oppdater UX Guidelines (docs/UX_GUIDELINES.md)
  ├─ 1B. Oppdater CSS-variabler (packages/ui/src/globals.css)
  └─ 1C. Oppdater density-utilities

Fase 2: Komponenter (packages/ui)
  ├─ 2A. Label — fra 11px uppercase til 13px medium normal-case
  ├─ 2B. Input — fra 13px til 14px, rounded-lg
  ├─ 2C. Button — fra 13px til 14px, rounded-lg, mykere aktiv-effekt
  ├─ 2D. Card — juster padding, beholde shadow-sm
  ├─ 2E. Select (ny) — felles stylet select-komponent
  └─ 2F. PageHeader (ny) — gjenbrukbar settings-header

Fase 3: Sider
  ├─ 3A. Profil-side — refaktorer til Airy-layout
  └─ 3B. Virksomhet-side — refaktorer til Airy-layout

Fase 4: Navigasjon & polish
  ├─ 4A. Sidebar aktive states — synkroniser med mockup blå pille
  └─ 4B. Status-farger — deploy i kanban/tabellmoduler
```

---

## 3. Fase 1: Fundament

### 1A. Oppdater `docs/UX_GUIDELINES.md`

**Hva endres:**

| Seksjon | Gammel regel | Ny regel |
|---------|-------------|----------|
| §1 Core Philosophy, "Compact by Default" | `13px` standard, `p-4 / gap-3` | `14px` standard, `p-5 / p-6 / gap-4` — "Airy by Default" |
| §1 Core Philosophy, "Labels as Metadata" | `11px`, bold, UPPERCASE, vid tracking | `13px`, medium weight, normal-case, standard tracking |
| §1 Core Philosophy, "Tactile Interactions" | `active:scale-[0.98]` beholdes men tones ned i tekst | Behold men gjør det valgfritt, ikke påkrevd |
| §2 Components, Card-beskrivelse | "tight but comfortable spacing" | "generous, breathable spacing" — `p-5/p-6`, `gap-4/gap-6` |
| §2 Components, radius | `rounded-md / rounded-lg` | `rounded-lg / rounded-xl` for paneler og kort |

**Nye seksjoner å legge til:**

1. **"Card-Based Canvas"** — Beskriv at arbeidsflaten bruker hvite kort (`--ak-bg-card`) på lysgrunn canvas (`--ak-bg-main`), med subtile skygger.
2. **"Status Colors"** — Definer at status-indikatorer (Working, Stuck, Done, Blank) har dedikerte tokens og bruker avrundede piller.
3. **"Settings Page Pattern"** — Beskriv at alle innstillingssider (Profil, Virksomhet, Struktur) skal bruke `<PageHeader>` + to-kolonne grid med `rounded-xl`-seksjoner.

---

### 1B. Oppdater `packages/ui/src/globals.css`

**Endringer i `:root`:**

```css
/* ENDRE: body font-size fra 13px → 14px */
body {
  font-size: 14px;
  line-height: 1.5;        /* opp fra 1.45 */
}

/* LEGG TIL: Status-fargetokens */
:root {
  /* ... eksisterende tokens ... */
  
  /* Status colors */
  --ak-status-working: #F0C341;      /* Gul — "Working on it" */
  --ak-status-working-bg: #FDF6E3;
  --ak-status-stuck: #E8697D;        /* Rød — "Stuck" */
  --ak-status-stuck-bg: #FDE8EC;
  --ak-status-done: #33D391;         /* Grønn — "Done" */
  --ak-status-done-bg: #E6F9F0;
  --ak-status-blank: #C4C4C4;        /* Grå — blank/unset */
  --ak-status-blank-bg: #F5F5F5;
}

.dark {
  /* Status colors – dark */
  --ak-status-working: #F0C341;
  --ak-status-working-bg: rgba(240, 195, 65, 0.15);
  --ak-status-stuck: #E8697D;
  --ak-status-stuck-bg: rgba(232, 105, 125, 0.15);
  --ak-status-done: #33D391;
  --ak-status-done-bg: rgba(51, 211, 145, 0.15);
  --ak-status-blank: #555555;
  --ak-status-blank-bg: rgba(85, 85, 85, 0.15);
}

.night {
  /* Status colors – night (same as dark, litt dempet) */
  --ak-status-working: #D4A830;
  --ak-status-working-bg: rgba(212, 168, 48, 0.12);
  --ak-status-stuck: #D05A6B;
  --ak-status-stuck-bg: rgba(208, 90, 107, 0.12);
  --ak-status-done: #2AB87D;
  --ak-status-done-bg: rgba(42, 184, 125, 0.12);
  --ak-status-blank: #444444;
  --ak-status-blank-bg: rgba(68, 68, 68, 0.12);
}
```

**Endringer i density-utilities:**

```css
/* Oppdater default density til romsligere verdier */
.density-compact {
  --ak-density-gap: 0.625rem;      /* 10px, opp fra 8px */
  --ak-density-pad: 0.875rem;      /* 14px, opp fra 12px */
  --ak-density-panel-pad: 1.25rem; /* 20px */
  --ak-density-control-height: 2.75rem;
}

.density-spacious {
  --ak-density-gap: 1rem;          /* 16px, opp fra 12px */
  --ak-density-pad: 1.25rem;       /* 20px, opp fra 14px */
  --ak-density-panel-pad: 1.5rem;  /* 24px */
  --ak-density-control-height: 3rem;
}
```

---

### 1C. Density som standard

**Vurder:** Skal `density-spacious` bli default for hele appen (settes på `<body>`), med `density-compact` bare brukt inni tabeller og lister der plassoptimering faktisk trengs?  
**Anbefaling:** Ja. Sett `density-spacious` som default, bruk `density-compact` eksplisitt.

---

## 4. Fase 2: Komponenter

### 2A. Label (`packages/ui/src/components/ui/label.tsx`)

**Nå:**
```tsx
"text-[11px] font-bold leading-none uppercase tracking-[0.14em] text-[var(--ak-text-muted)]"
```

**Nytt:**
```tsx
"text-[13px] font-medium leading-none text-[var(--ak-text-dim)]"
```

Endringer:
- `11px` → `13px` — lesbart uten forstørrelsesglass
- `font-bold` → `font-medium` — roligere, ikke skrikende
- Fjern `uppercase` og `tracking-[0.14em]` — mockupen bruker normal-case labels
- `--ak-text-muted` → `--ak-text-dim` — litt mørkere for bedre lesbarhet (muted er for sekundær metadata, dim for labels)

---

### 2B. Input (`packages/ui/src/components/ui/input.tsx`)

**Endringer:**
```diff
- text-[13px]
+ text-[14px]

- rounded-md
+ rounded-lg

- min-h-11
+ min-h-[2.75rem]  (beholdes, er allerede 44px)
```

`file:text-[13px]` → `file:text-[14px]` også.

---

### 2C. Button (`packages/ui/src/components/ui/button.tsx`)

**Endringer:**
```diff
(base variant string)
- text-[13px]
+ text-[14px]

- rounded-md
+ rounded-lg

(size sm)
- text-[12px]
+ text-[13px]
```

Alt annet beholdes. `active:scale-[0.98]` er fint og subtilt — behold.

---

### 2D. Card (`packages/ui/src/components/ui/card.tsx`)

**Endringer:**
```diff
Card:
- rounded-lg
+ rounded-xl

CardDescription:
- text-[13px]
+ text-[14px]
```

Padding i `CardHeader` (`p-4 sm:p-5`) og `CardContent` (`p-4 pt-0 sm:p-5 sm:pt-0`) er allerede ok, men kan økes til `p-5 sm:p-6` for konsistens med det nye luftige opplegget.

---

### 2E. Select-komponent (ny — `packages/ui/src/components/ui/select-native.tsx`)

Begge sider (profil + virksomhet) bruker rå `<select>` med inline klasser. Lag en liten wrapper:

```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

const SelectNative = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex min-h-[2.75rem] w-full rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-[14px] text-[var(--ak-text-main)] shadow-sm ring-offset-[var(--ak-bg-main)] transition-[border-color,box-shadow] focus-visible:border-[var(--ak-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ak-ring)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
SelectNative.displayName = "SelectNative";

export { SelectNative };
```

Eksporter fra `packages/ui/src/index.ts`.

---

### 2F. PageHeader-komponent (ny — `packages/ui/src/components/ui/page-header.tsx`)

Alle innstillingssider bruker samme introduksjonsblokk. Gjør denne til en gjenbrukbar komponent:

```tsx
import * as React from "react";
import { cn } from "../../lib/utils";

interface PageHeaderProps {
  category: string;       // f.eks. "Konto og personlige valg"
  title: string;          // f.eks. "Min profil"
  description?: string;   // f.eks. "Her kan du oppdatere..."
  className?: string;
}

function PageHeader({ category, title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-[var(--ak-accent)]">{category}</p>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ak-text-main)] sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[14px] text-[var(--ak-text-muted)] sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export { PageHeader, type PageHeaderProps };
```

Eksporter fra `packages/ui/src/index.ts`.

---

## 5. Fase 3: Sider

### 3A. Profil-side (`apps/arbeidskassen/app/[locale]/(authenticated)/profil/page.tsx`)

**Justeringer:**

| Element | Nå | Nytt |
|---------|-----|------|
| Page header | Inline `<h1>` + `<p>` | `<PageHeader>` komponent |
| Section panels | `rounded-3xl` | `rounded-xl` |
| Section bg | `bg-[var(--ak-bg-panel)]` | `bg-[var(--ak-bg-card)]` (hvite kort) |
| Section padding | `p-5 sm:p-6` | `p-6 sm:p-7` (mer luft) |
| Inner grid gap | `gap-4` | `gap-5` |
| Form labels (`<Label>`) | Automatisk via komponent | Automatisk via oppdatert Label |
| Varsler-checkboxer | `rounded-2xl` | `rounded-xl` — konsistent med sections |
| Varsler-checkboxer bg | `bg-[var(--ak-bg-main)]` | `bg-[var(--ak-bg-panel)]` (subtilt skille fra seksjon) |
| Alert-banners | `rounded-2xl` | `rounded-xl` |
| Select-elementer | Inline `<select>` | `<SelectNative>` komponent |

---

### 3B. Virksomhet-side (`apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/virksomhet/page.tsx`)

Eksakt samme endringer som profil-siden:

- `rounded-3xl` → `rounded-xl`
- `bg-[var(--ak-bg-panel)]` → `bg-[var(--ak-bg-card)]` for sections
- Bruk `<PageHeader>` 
- Bruk `<SelectNative>` istedenfor inline selects
- Øk padding fra `p-5 sm:p-6` → `p-6 sm:p-7`

---

## 6. Fase 4: Navigasjon & polish

### 4A. Sidebar aktive states

Mockupene viser at aktive moduler i toppnavigasjonen har en tydelig **blå bakgrunn med hvit tekst** (pill-form). Vår nåværende navbar bruker allerede `--ak-accent` for aktive tabs, men vi bør verifisere at:

- Aktiv modul-tab har `bg-[var(--ak-accent)] text-white rounded-full px-3 py-1` (pill-form)
- Inactive tabs er `text-[var(--ak-text-dim)]` uten bakgrunn
- Hover på inactive: `bg-[var(--ak-bg-hover)] rounded-full`

**Fil:** `packages/ui/src/components/navbar.tsx` — `ModuleTabs` komponent.

### 4A.1 Left settings sidebar pattern

For settings-heavy modules, we now also standardize a **flush-left, full-height sidebar** pattern:

- Sidebar is attached to the far left edge under the navbar
- Desktop width stays narrow (`~220px–248px`)
- Active link uses a strong blue fill with white text
- The main content area stays lighter and scrolls independently
- The default route should open the first real settings page, not a placeholder overview

This pattern is now the preferred direction for `Organisasjon` and similar admin/settings apps.

### 4B. Status-piller 

Lag en `StatusBadge`-komponent i `packages/ui` som bruker de nye status-tokens:

```tsx
type StatusVariant = "working" | "stuck" | "done" | "blank";

function StatusBadge({ variant, label }: { variant: StatusVariant; label: string }) {
  const styles = {
    working: "bg-[var(--ak-status-working)] text-white",
    stuck: "bg-[var(--ak-status-stuck)] text-white",
    done: "bg-[var(--ak-status-done)] text-white",
    blank: "bg-[var(--ak-status-blank-bg)] text-[var(--ak-text-muted)]",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium", styles[variant])}>
      {label}
    </span>
  );
}
```

---

## 7. Filplan — Alle filer som berøres

| Fil | Type endring | Fase |
|-----|-------------|------|
| [docs/UX_GUIDELINES.md](docs/UX_GUIDELINES.md) | Rewrite seksjoner §1, §2 | 1A |
| [packages/ui/src/globals.css](packages/ui/src/globals.css) | Body font, status-tokens, density | 1B |
| [packages/ui/src/components/ui/label.tsx](packages/ui/src/components/ui/label.tsx) | 11px→13px, fjern uppercase | 2A |
| [packages/ui/src/components/ui/input.tsx](packages/ui/src/components/ui/input.tsx) | 13px→14px, rounded-md→rounded-lg | 2B |
| [packages/ui/src/components/ui/button.tsx](packages/ui/src/components/ui/button.tsx) | 13px→14px, rounded-md→rounded-lg | 2C |
| [packages/ui/src/components/ui/card.tsx](packages/ui/src/components/ui/card.tsx) | rounded-lg→rounded-xl, padding opp | 2D |
| `packages/ui/src/components/ui/select-native.tsx` | **NY FIL** | 2E |
| `packages/ui/src/components/ui/page-header.tsx` | **NY FIL** | 2F |
| `packages/ui/src/components/ui/status-badge.tsx` | **NY FIL** | 4B |
| [packages/ui/src/index.ts](packages/ui/src/index.ts) | Eksporter nye komponenter | 2E/2F/4B |
| [apps/arbeidskassen/app/[locale]/(authenticated)/profil/page.tsx](apps/arbeidskassen/app/%5Blocale%5D/(authenticated)/profil/page.tsx) | Refaktorer layout | 3A |
| [apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/virksomhet/page.tsx](apps/arbeidskassen/app/%5Blocale%5D/(authenticated)/organisasjon/virksomhet/page.tsx) | Refaktorer layout | 3B |
| [packages/ui/src/components/navbar.tsx](packages/ui/src/components/navbar.tsx) | Verifiser/juster aktive states | 4A |

---

## 8. Prioritering og avhengigheter

```
Fase 1 (Fundament) ──→ Fase 2 (Komponenter) ──→ Fase 3 (Sider)
                                                    ↑
                                              Fase 4 (parallelt)
```

- **Fase 1 FØRST** — alt annet bygger på tokens og guidelines
- **Fase 2** avhenger av Fase 1 (nye fontstørrelser og radii)
- **Fase 3A og 3B** kan gjøres parallelt etter Fase 2
- **Fase 4** kan starte parallelt med Fase 3

---

## 9. Verifikasjonskriterier

### Visuelt (manuell sjekk)
- [ ] Profil-siden har hvite kort (`rounded-xl`) på lysgrå canvas — ikke enorme `rounded-3xl` bobler
- [ ] Labels er lesbare og normal-case — ikke skrikende UPPERCASE
- [ ] Inputfelt og knapper føles proporsjonerte med 14px tekst
- [ ] Select-elementer har konsistent styling med Input
- [ ] Virksomhet-siden ser identisk ut i layout-stil som Profil
- [ ] Light mode: tekst-kontrast ≥ 4.5:1 (WCAG AA)
- [ ] Dark mode: alle tokens ser riktige ut, status-farger fungerer
- [ ] Navbar aktive modul har tydelig visuell indikator

### Kode (automatisk/manuell)
- [ ] `pnpm build` passerer for alle apps
- [ ] Ingen TypeScript-feil etter komponentendringer
- [ ] PageHeader, SelectNative, StatusBadge eksportert fra `@arbeidskassen/ui`
- [ ] Ingen inline `<select>` i profil/virksomhet-sider — bruk `<SelectNative>`
- [ ] Ingen `rounded-3xl` i settingsseksjoner — kun `rounded-xl`

---

## 10. Hva vi IKKE endrer (bevisst)

- **Navigasjonsstruktur** — sidebar/topbar plassering beholdes
- **Font-family** — Inter beholdes (nær nok Plus Jakarta Sans, og allerede i produksjon)
- **Accent-farge** — `#5B6CF9` beholdes, matcher mockupens blå
- **Radix/shadcn-arkitekturen** — kun CSS-justeringer, ingen strukturelle endringer
- **`active:scale-[0.98]`** — Beholdes som standard for knapper, bare tones ned i dokumentasjonen
- **Theming-arkitekturen** — Light/Dark/Night/System beholdes som er
- **Moduletabs i navbar** — Allerede veldig likt mockupen, bare verifisér styling

---

## 11. Oppsummering av designfilosofiskiftet

| Før | Etter |
|-----|-------|
| "Compact by Default" | "Breathable by Default" |
| Inspirert av Linear, Milanote | Inspirert av monday.com workspace |
| 13px body, 11px labels | 14px body, 13px labels |
| Tette paneler, minimal whitespace | Luftige kort, generøs whitespace |
| UPPERCASE labels, vid tracking | Normal-case, standard tracking |
| `rounded-3xl` overalt | `rounded-xl` for kort, `rounded-lg` for inputs |
| Monokrom status | Fargerike status-piller |
| Implicit density | Eksplisitt density-classes med spacious som default |
