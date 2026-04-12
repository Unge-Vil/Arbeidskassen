# Konsolideringsplan: 7 apper → 1 app

> Detaljert faseplan for å konsolidere alle 7 Next.js-apper til én enkelt app (`apps/arbeidskassen`), med moduler som rutegrupper i stedet for separate prosjekter.

---

## Innholdsfortegnelse

- [Bakgrunn og mål](#bakgrunn-og-mål)
- [Nåværende tilstand](#nåværende-tilstand)
- [Målarkitektur](#målarkitektur)
- [Faseoversikt](#faseoversikt)
- [Fase 0: Forberedelse og sikkerhetsnett](#fase-0-forberedelse-og-sikkerhetsnett)
- [Fase 1: Konsolider i18n-meldinger](#fase-1-konsolider-i18n-meldinger)
- [Fase 2: Flytt BookDet inn i hovedappen](#fase-2-flytt-bookdet-inn-i-hovedappen)
- [Fase 3: Flytt Organisasjon inn i hovedappen](#fase-3-flytt-organisasjon-inn-i-hovedappen)
- [Fase 4: Flytt TeamArea inn i hovedappen](#fase-4-flytt-teamarea-inn-i-hovedappen)
- [Fase 5: Flytt Today, Backoffice og Sales Portal](#fase-5-flytt-today-backoffice-og-sales-portal)
- [Fase 6: Konsolider middleware og navigasjon](#fase-6-konsolider-middleware-og-navigasjon)
- [Fase 7: Rydd opp i packages og config](#fase-7-rydd-opp-i-packages-og-config)
- [Fase 8: Oppdater dokumentasjon og deployment](#fase-8-oppdater-dokumentasjon-og-deployment)
- [Fase 9: Sletting og verifisering](#fase-9-sletting-og-verifisering)
- [Risiko og fallback](#risiko-og-fallback)
- [Dokumenter som må oppdateres](#dokumenter-som-må-oppdateres)

---

## Bakgrunn og mål

### Problemet

Arbeidskassen er strukturert som et monorepo med 7 separate Next.js-apper. Denne arkitekturen er designet for et team på 5–15 utviklere med separate domeneansvar. Vi er to personer. Resultatet:

- **7 × duplisert boilerplate**: Hver app har sin egen `middleware.ts`, `next.config.ts`, `i18n/routing.ts`, `messages/`, `postcss.config.mjs`, `tsconfig.json`, `error.tsx`, og `globals.css` — alle nesten identiske.
- **7 dev-servere**: Lokal utvikling krever opptil 7 parallelle Next.js-prosesser.
- **Kun 1 app deployes**: `vercel.json` bygger bare `@arbeidskassen/web`. De 6 andre appene er aldri testet i produksjon.
- **Proxy-kompleksitet**: Arbeidskassen-appen proxyer til de andre via `rewrites` i `next.config.ts`, noe som legger til latens og feilkilder.
- **AI-verktøy forvirres**: Copilot/AI må forstå 7 apper + 3 packages + monorepo-avhengigheter for å gjøre endringer.

### Målet

**Én Next.js-app** med moduler som rutegrupper. Samme funksjonalitet, dramatisk enklere:

- 1 `middleware.ts` i stedet for 7
- 1 dev-server i stedet for 7
- 1 deploys i stedet for 1 + 6 ubrukte
- Ingen proxy-rewrites for interne moduler
- AI-verktøy kan jobbe direkte i én rutestruktur

### Hva vi beholder

- `packages/ui` — Delt komponentbibliotek (gir fortsatt mening)
- `packages/supabase` — Auth, RLS, database-lag (gir fortsatt mening)
- `packages/config` — ESLint, Prettier, TypeScript-presets
- Hele designsystemet (CSS-variabler, temaer)
- All forretningslogikk og UI-kode (flyttes, ikke slettes)
- WCAG 2.1 AA-compliance

---

## Nåværende tilstand

### App-inventar

| App | Port | Reelt innhold | Status |
|-----|------|---------------|--------|
| `arbeidskassen` | 3000 | Login, tenant-valg, dashboard, profil, modul-fallbacks | Produksjon |
| `bookdet` | 3001 | 7 sider: oversikt, søk & book, mine bookinger, bookinger, ressurser, sjekklister, innstillinger | MVP |
| `organisasjon` | 3002 | 6 sider: virksomhet, brukere, roller, struktur, fakturering, audit-logg | Produksjon |
| `teamarea` | 3005 | 1 side: feed med nyheter, lagrede innlegg, kunngjøringer | MVP |
| `today` | 3004 | 1 side: "kommer snart"-placeholder | Placeholder |
| `backoffice` | 3099 | 1 side: dashboard med metrikker | MVP |
| `sales-portal` | 3003 | 1 side: tom placeholder | Placeholder |

### Duplisert boilerplate per app

Hver av de 7 appene har disse filene som er nesten identiske:

| Fil | Variasjon |
|-----|-----------|
| `middleware.ts` | Bare `APP_AUTH_POLICIES.appName` varierer |
| `i18n/routing.ts` | 100% identisk |
| `i18n/routing.test.ts` | 100% identisk |
| `i18n/request.ts` | 100% identisk |
| `postcss.config.mjs` | 100% identisk |
| `tsconfig.json` | 100% identisk |
| `package.json` | Bare navn og port varierer |
| `next.config.ts` | Bare `basePath` og proxy-config varierer |
| `app/error.tsx` | Bare tittelstreng varierer |
| `app/[locale]/globals.css` | 99% identisk (arbeidskassen har `@source`-linje) |
| `messages/no.json` → `common`-nøkler | Identisk base, modul-spesifikke nøkler varierer |
| `messages/en.json` → `common`-nøkler | Identisk base, modul-spesifikke nøkler varierer |
| `actions/auth.ts` | Nesten identisk (bookdet, teamarea, organisasjon har kopi) |

### Duplisert shell-mønster

4 apper (bookdet, teamarea, organisasjon, arbeidskassen) har egne shell-komponenter som alle gjør det samme:

1. Rendrer `<Navbar>` fra `@arbeidskassen/ui`
2. Henter `getTenantContext()` og `getCurrentUserProfile()`
3. Bygger `tenantOptions`-array med formatert rolle
4. Setter opp `signOutAction`, `switchTenantAction`, `updateThemePreferenceAction`
5. Wrapper children i et 2-kolonne layout (sidebar + main)

Denne logikken finnes i:
- `apps/arbeidskassen/app/[locale]/(authenticated)/layout.tsx` + `authenticated-shell.tsx`
- `apps/bookdet/app/[locale]/layout.tsx` + `bookdet-shell.tsx`
- `apps/teamarea/app/[locale]/layout.tsx` + `teamarea-shell.tsx`
- `apps/organisasjon/app/[locale]/layout.tsx` + `organization-shell.tsx`

### Tester som finnes

| Testfil | Konsolideringsrisiko |
|---------|---------------------|
| 7 × `i18n/routing.test.ts` | Slettes (erstattes av 1) |
| `packages/supabase/src/middleware.test.ts` | **MÅ OPPDATERES** — tester `APP_AUTH_POLICIES` |
| `packages/ui/src/lib/admin-links.test.ts` | **MÅ OPPDATERES** — tester cross-app URL-oppløsning |
| `packages/supabase/src/auth.test.ts` | Trygg (ingen app-spesifikk logikk) |
| `packages/supabase/src/profile.test.ts` | Trygg |
| `packages/supabase/src/organization.test.ts` | Trygg |
| `packages/ui/src/components/theme-utils.test.ts` | Trygg |
| `packages/ui/src/components/dashboard/*.test.ts` | Trygg |

---

## Målarkitektur

### Rutestruktur

```
apps/arbeidskassen/
├── middleware.ts                          ← Én felles middleware
├── next.config.ts                        ← Uten proxy-rewrites
├── i18n/
│   ├── routing.ts                        ← Én routing-config
│   ├── routing.test.ts                   ← Én test
│   └── request.ts
├── messages/
│   ├── no.json                           ← Alle meldinger samlet
│   └── en.json
├── app/
│   ├── layout.tsx                        ← Root layout (html, body, ThemeProvider)
│   ├── error.tsx                         ← Global error boundary
│   ├── page.tsx                          ← Redirect til [locale]
│   │
│   ├── [locale]/
│   │   ├── globals.css
│   │   ├── layout.tsx                    ← NextIntlClientProvider
│   │   ├── page.tsx                      ← Landingsside (uautentisert)
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx                  ← Login-skjema
│   │   │
│   │   ├── select-tenant/
│   │   │   └── page.tsx                  ← Tenant-velger
│   │   │
│   │   ├── (authenticated)/
│   │   │   ├── layout.tsx                ← Auth-guard + navbar + tenant-context
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              ← Dashboard med grid
│   │   │   │
│   │   │   ├── profil/
│   │   │   │   └── page.tsx              ← Profilinnstillinger
│   │   │   │
│   │   │   ├── bookdet/
│   │   │   │   ├── layout.tsx            ← BookDet sidebar-shell
│   │   │   │   ├── page.tsx              ← Redirect til oversikt
│   │   │   │   ├── oversikt/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── sok-book/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── mine-bookinger/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── bookinger/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── ressurser/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── ny/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [resourceId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── sjekklister/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── innstillinger/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── organisasjon/
│   │   │   │   ├── layout.tsx            ← Organisasjon sidebar-shell
│   │   │   │   ├── page.tsx              ← Redirect til virksomhet
│   │   │   │   ├── virksomhet/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── brukere/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── roller/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── struktur/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── fakturering/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── audit-logg/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── teamarea/
│   │   │   │   ├── layout.tsx            ← TeamArea sidebar-shell
│   │   │   │   └── page.tsx              ← Feed-side
│   │   │   │
│   │   │   ├── today/
│   │   │   │   └── page.tsx              ← Kommer snart
│   │   │   │
│   │   │   ├── backoffice/
│   │   │   │   └── page.tsx              ← Plattform-dashboard
│   │   │   │
│   │   │   └── sales-portal/
│   │   │       └── page.tsx              ← Salgsportal
│   │   │
│   │   └── (public)/                     ← Fremtidig: offentlige BookDet-sider
│   │       └── book/
│   │           └── [slug]/
│   │               └── page.tsx
│   │
│   └── actions/
│       ├── auth.ts                       ← Én felles auth-actions
│       ├── profile.ts                    ← Profilhandlinger
│       ├── dashboard.ts                  ← Dashboard CRUD
│       ├── tenant.ts                     ← Fra organisasjon
│       ├── members.ts                    ← Fra organisasjon
│       ├── roles.ts                      ← Fra organisasjon
│       └── structure.ts                  ← Fra organisasjon
```

### Viktige arkitekturendringer

| Før | Etter |
|-----|-------|
| 7 separate `middleware.ts` | 1 `middleware.ts` med unified auth-logic |
| 7 `next.config.ts` med proxy-rewrites | 1 `next.config.ts` uten rewrites |
| 7 `i18n/routing.ts` (identiske) | 1 `i18n/routing.ts` |
| 7 `messages/no.json` + `en.json` | 1 sammenslått `messages/no.json` + `en.json` |
| 4 separate shell-komponenter | Shell-komponentene flyttes til `(authenticated)/[modul]/layout.tsx` |
| `APP_AUTH_POLICIES` med 7 entries | 1 policy (alt autentisert under `(authenticated)/`) |
| `resolveAdminAppHrefs()` med URLs til 7 apper | Enkel path-mapping uten app-URLs |
| 7 `error.tsx` med ulik tittel | 1 global + evt. modul-spesifikke `error.tsx` |
| 7 dev-servere (port 3000–3099) | 1 dev-server (port 3000) |

---

## Faseoversikt

```
Fase 0 ─── Forberedelse og sikkerhetsnett        [~30 min]
  │
Fase 1 ─── Konsolider i18n-meldinger             [~30 min]
  │
Fase 2 ─── Flytt BookDet inn                     [~1-2 timer]
  │
Fase 3 ─── Flytt Organisasjon inn                [~1-2 timer]
  │
Fase 4 ─── Flytt TeamArea inn                    [~30 min]
  │
Fase 5 ─── Flytt Today, Backoffice, Sales Portal [~30 min]
  │
Fase 6 ─── Konsolider middleware og navigasjon    [~1-2 timer]
  │
Fase 7 ─── Rydd opp i packages og config         [~30 min]
  │
Fase 8 ─── Oppdater dokumentasjon og deployment   [~1-2 timer]
  │
Fase 9 ─── Sletting og verifisering              [~30 min]
```

Hver fase er designet for å kunne utføres av en agent eller manuelt, bekreftes med `CI=1 pnpm verify`, og committes separat.

---

## Fase 0: Forberedelse og sikkerhetsnett

**Mål:** Sikre at vi har et trygt utgangspunkt med alt grønt.

### Steg

1. **Commit og push all eksisterende kode**
   ```bash
   git add -A && git commit -m "chore: snapshot before consolidation"
   git push origin main
   ```

2. **Opprett en konsolideringsbranch**
   ```bash
   git checkout -b consolidate/single-app
   ```

3. **Verifiser at alt er grønt**
   ```bash
   CI=1 pnpm verify
   ```
   Forventet: 0 lint-feil, alle tester grønn, build OK.

4. **Lag backup av alle app-mapper**
   ```bash
   mkdir -p _backup
   cp -r apps/bookdet _backup/bookdet
   cp -r apps/organisasjon _backup/organisasjon
   cp -r apps/teamarea _backup/teamarea
   cp -r apps/today _backup/today
   cp -r apps/backoffice _backup/backoffice
   cp -r apps/sales-portal _backup/sales-portal
   ```

5. **Commit backup**
   ```bash
   git add _backup && git commit -m "chore: backup all apps before consolidation"
   ```

### Suksesskriterium
- `CI=1 pnpm verify` er grønt
- Alle apper finnes i `_backup/`
- Vi er på `consolidate/single-app`-branchen

---

## Fase 1: Konsolider i18n-meldinger

**Mål:** Slå sammen alle `messages/no.json` og `messages/en.json` fra de 7 appene til én fil i `apps/arbeidskassen/messages/`.

### Bakgrunn

Alle apper har samme `common`-nøkler. Modul-spesifikke nøkler er namespace-prefikset (f.eks. `bookdetShell`, `bookdetPages`, `todayHome`, `teamareaShell`). Det er ingen navnekollisjoner.

### Steg

1. **Les alle `messages/no.json`-filer** fra de 7 appene

2. **Slå sammen til én `messages/no.json`** i `apps/arbeidskassen/messages/`:
   ```json
   {
     "common": { ... },
     "bookdetHome": { ... },
     "bookdetShell": { ... },
     "bookdetPages": { ... },
     "todayHome": { ... },
     "teamareaShell": { ... },
     "teamareaHome": { ... },
     "organizationShell": { ... }
   }
   ```
   Strategi: `common`-nøklene fra `apps/arbeidskassen` er master. Modul-spesifikke top-level-nøkler kopieres rett inn.

3. **Gjenta for `messages/en.json`**

4. **Verifiser:**
   ```bash
   # Sjekk at alle top-level-nøkler fra alle apper finnes
   node -e "const no = require('./apps/arbeidskassen/messages/no.json'); console.log(Object.keys(no));"
   ```

### Hva som IKKE endres i denne fasen
- Ingen filer flyttes ennå
- Ingen apper slettes
- De andre appenes `messages/` forblir urørt (brukes som referanse)

### Suksesskriterium
- `apps/arbeidskassen/messages/no.json` inneholder alle nøkler fra alle 7 apper
- `apps/arbeidskassen/messages/en.json` inneholder tilsvarende engelske nøkler
- `CI=1 pnpm verify` er fortsatt grønt (de andre appene er urørt)
- Commit: `feat: consolidate all i18n messages into main app`

---

## Fase 2: Flytt BookDet inn i hovedappen

**Mål:** Flytt all BookDet-funksjonalitet til `apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/`.

### BookDets nåværende struktur

```
apps/bookdet/app/[locale]/
├── bookdet-shell.tsx              → Sidebar-komponent
├── bookdet-section-page.tsx       → Seksjon-template
├── page.tsx                       → Redirect til /oversikt
├── oversikt/page.tsx
├── sok-book/page.tsx
├── mine-bookinger/page.tsx
├── bookinger/page.tsx
├── ressurser/
│   ├── page.tsx
│   ├── ny/page.tsx
│   └── [resourceId]/page.tsx
├── sjekklister/page.tsx
└── innstillinger/page.tsx
```

### Steg

1. **Opprett mål-mappestruktur**
   ```bash
   mkdir -p apps/arbeidskassen/app/\[locale\]/\(authenticated\)/bookdet
   ```

2. **Flytt alle sider**
   ```bash
   # Kopier BookDets sider inn
   cp -r apps/bookdet/app/\[locale\]/oversikt \
         apps/bookdet/app/\[locale\]/sok-book \
         apps/bookdet/app/\[locale\]/mine-bookinger \
         apps/bookdet/app/\[locale\]/bookinger \
         apps/bookdet/app/\[locale\]/ressurser \
         apps/bookdet/app/\[locale\]/sjekklister \
         apps/bookdet/app/\[locale\]/innstillinger \
     apps/arbeidskassen/app/\[locale\]/\(authenticated\)/bookdet/
   ```

3. **Opprett `bookdet/page.tsx`** — redirect til oversikt
   ```typescript
   import { redirect } from "next/navigation";

   export default async function BookdetPage({
     params,
   }: {
     params: Promise<{ locale: string }>;
   }) {
     const { locale } = await params;
     redirect(`/${locale}/bookdet/oversikt`);
   }
   ```

4. **Opprett `bookdet/layout.tsx`** — BookDet shell  
   Flytt `bookdet-shell.tsx` og `bookdet-section-page.tsx` hit.  
   
   Nøkkelendringer:
   - **Fjern** `<html>`, `<body>`, `<ThemeProvider>`, `<NextIntlClientProvider>` — dette håndteres av rot-layout.
   - **Fjern** auth-sjekk og tenant-context-henting — dette håndteres av `(authenticated)/layout.tsx`.
   - **Behold** sidebar-navigasjon og `<BookdetShell>`-wrapping.
   - **Oppdater import-stier**: `../../i18n/routing` → `../../../../i18n/routing` (eller bruk `@/`-alias).
   
   Den nye `bookdet/layout.tsx` skal bare wrape children i `<BookdetShell>`:
   ```typescript
   import { BookdetShell } from "./bookdet-shell";

   export const metadata = {
     title: "BookDet",
     description: "BookDet — bookingmodul i Arbeidskassen",
   };

   export default function BookdetLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return <BookdetShell>{children}</BookdetShell>;
   }
   ```

5. **Tilpass `bookdet-shell.tsx`**
   - Fjern `<Navbar>` (rendres av `(authenticated)/layout.tsx`)
   - Fjern alle auth/tenant-props (kommer fra parent layout context)
   - Behold kun sidebar-navigasjonen og 2-kolonne layout
   - Oppdater lenker fra `<Link href="/oversikt">` til `<Link href="/bookdet/oversikt">` — ELLER bruk relative lenker med pathname-prefiks

6. **Flytt BookDets server actions**
   ```bash
   cp apps/bookdet/app/actions/auth.ts apps/arbeidskassen/app/actions/
   ```
   BookDets `auth.ts` er en kopi av arbeidskassens. Fjern kopien og pek alle imports til den eksisterende.

7. **Oppdater import-stier i alle flyttede filer**
   - `from "../../i18n/routing"` → `from "@/i18n/routing"` (eller rett relativ sti)
   - `from "../actions/auth"` → fjern (bruker felles auth-actions fra `(authenticated)/layout.tsx`)
   - `from "@arbeidskassen/ui"` og `from "@arbeidskassen/supabase"` → uendret

8. **Verifiser**
   ```bash
   pnpm --filter @arbeidskassen/web dev
   # Naviger til http://localhost:3000/no/bookdet/oversikt
   ```

### Kjente fallgruver

- **Sidebar-lenker** i `bookdet-shell.tsx` bruker `<Link href="/oversikt">` som nå må bli `/bookdet/oversikt` (med locale).
- **Metadata**: `export const metadata` i `bookdet/layout.tsx` overstyrer parent metadata for BookDet-sider.
- **`bookdet-section-page.tsx`** bruker `usePathname()` — sjekk at pathname nå inkluderer `/bookdet/`-prefiks.

### Suksesskriterium
- Alle BookDet-sider er tilgjengelige under `/(authenticated)/bookdet/*`
- Sidebar-navigasjon fungerer
- Auth og tenant-context håndteres av parent layout
- `CI=1 pnpm verify` grønt (ignorer bookdet-appen midlertidig)
- Commit: `feat: move bookdet into main app as route group`

---

## Fase 3: Flytt Organisasjon inn i hovedappen

**Mål:** Flytt all Organisasjon-funksjonalitet til `apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/`.

### Organisasjons nåværende struktur

```
apps/organisasjon/app/[locale]/
├── organization-shell.tsx         → Sidebar-komponent
├── page.tsx                       → Redirect til /virksomhet
├── virksomhet/page.tsx
├── brukere/page.tsx
├── roller/page.tsx
├── struktur/page.tsx
├── fakturering/page.tsx
└── audit-logg/page.tsx

apps/organisasjon/app/actions/
├── auth.ts                        → Kopi av arbeidskassens
├── tenant.ts                      → Tenant-handlinger
├── roles.ts                       → Rolle-handlinger
├── members.ts                     → Medlem-handlinger
└── structure.ts                   → Struktur-handlinger
```

### Steg

1. **Opprett mål-mappestruktur**
   ```bash
   mkdir -p apps/arbeidskassen/app/\[locale\]/\(authenticated\)/organisasjon
   ```

2. **Flytt alle sider**
   ```bash
   cp -r apps/organisasjon/app/\[locale\]/virksomhet \
         apps/organisasjon/app/\[locale\]/brukere \
         apps/organisasjon/app/\[locale\]/roller \
         apps/organisasjon/app/\[locale\]/struktur \
         apps/organisasjon/app/\[locale\]/fakturering \
         apps/organisasjon/app/\[locale\]/audit-logg \
     apps/arbeidskassen/app/\[locale\]/\(authenticated\)/organisasjon/
   ```

3. **Opprett `organisasjon/page.tsx`** — redirect til virksomhet
   ```typescript
   import { redirect } from "next/navigation";

   export default async function OrganisasjonPage({
     params,
   }: {
     params: Promise<{ locale: string }>;
   }) {
     const { locale } = await params;
     redirect(`/${locale}/organisasjon/virksomhet`);
   }
   ```

4. **Opprett `organisasjon/layout.tsx`** med `OrganizationShell`
   - Flytt `organization-shell.tsx` hit
   - Fjern `<Navbar>`, auth-logikk, `<html>/<body>/<ThemeProvider>`
   - Behold sidebar-navigasjon med 6 seksjoner
   - Oppdater lenker: `/virksomhet` → `/organisasjon/virksomhet` osv.

5. **Flytt server actions**
   ```bash
   cp apps/organisasjon/app/actions/tenant.ts \
      apps/organisasjon/app/actions/roles.ts \
      apps/organisasjon/app/actions/members.ts \
      apps/organisasjon/app/actions/structure.ts \
     apps/arbeidskassen/app/actions/
   ```
   `auth.ts` fra organisasjon er en kopi — slett den.

6. **Oppdater import-stier** i alle flyttede side-filer:
   - Server actions: `from "../../actions/tenant"` → `from "@/actions/tenant"` eller rett relativ sti
   - UI-imports: uendret
   - Supabase-imports: uendret

7. **Verifiser**
   ```bash
   pnpm --filter @arbeidskassen/web dev
   # Naviger til http://localhost:3000/no/organisasjon/virksomhet
   ```

### Suksesskriterium
- Alle 6 organisasjon-sider er tilgjengelige under `/(authenticated)/organisasjon/*`
- Sidebar-navigasjon fungerer
- Server actions (tenant, members, roles, structure) fungerer
- Commit: `feat: move organisasjon into main app as route group`

---

## Fase 4: Flytt TeamArea inn i hovedappen

**Mål:** Flytt TeamArea til `apps/arbeidskassen/app/[locale]/(authenticated)/teamarea/`.

### TeamAreas nåværende struktur

```
apps/teamarea/app/[locale]/
├── teamarea-shell.tsx             → Shell med sidebar (feed, lagrede, kunngjøringer)
├── layout.tsx                     → Full layout med auth
└── page.tsx                       → Feed-side med interaktivt innhold

apps/teamarea/app/actions/
└── auth.ts                        → Kopi av arbeidskassens
```

### Steg

1. **Opprett mål-mappestruktur**
   ```bash
   mkdir -p apps/arbeidskassen/app/\[locale\]/\(authenticated\)/teamarea
   ```

2. **Flytt filer**
   ```bash
   cp apps/teamarea/app/\[locale\]/page.tsx \
      apps/teamarea/app/\[locale\]/teamarea-shell.tsx \
     apps/arbeidskassen/app/\[locale\]/\(authenticated\)/teamarea/
   ```

3. **Opprett `teamarea/layout.tsx`**
   ```typescript
   import { TeamAreaShell } from "./teamarea-shell";

   export const metadata = {
     title: "TeamArea",
     description: "TeamArea — intern feed i Arbeidskassen",
   };

   export default function TeamareaLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return <TeamAreaShell>{children}</TeamAreaShell>;
   }
   ```

4. **Tilpass `teamarea-shell.tsx`**
   - Fjern `<Navbar>`, auth, tenant-context, `<html>/<body>/<ThemeProvider>`
   - Fjern `isPreviewMode`-logikk og `hasSupabaseEnv`-sjekk (ikke nødvendig i konsolidert app)
   - Behold sidebar og feed-layout

5. **`auth.ts` fra teamarea** — slett (bruk felles)

6. **Verifiser**
   ```bash
   pnpm --filter @arbeidskassen/web dev
   # Naviger til http://localhost:3000/no/teamarea
   ```

### Suksesskriterium
- TeamArea-feed rendres under `/(authenticated)/teamarea`
- Sidebar med grupper fungerer
- Commit: `feat: move teamarea into main app as route group`

---

## Fase 5: Flytt Today, Backoffice og Sales Portal

**Mål:** Flytt de tre minste appene (som er placeholders / minimale) inn i hovedappen.

### Disse appene er enkle

- **Today**: 1 side — `ModuleComingSoonPage`
- **Backoffice**: 1 side — `DashboardGrid` med hardkodede metrikker
- **Sales Portal**: 1 side — tom placeholder

### Steg

1. **Today** → `apps/arbeidskassen/app/[locale]/(authenticated)/today/page.tsx`
   ```bash
   cp apps/today/app/\[locale\]/page.tsx \
     apps/arbeidskassen/app/\[locale\]/\(authenticated\)/today/page.tsx
   ```
   Tilpass: fjern `resolveAdminAppHrefs`-kall i page.tsx som genererer separate app-URLer. Bruk interne paths i stedet.

2. **Backoffice** → `apps/arbeidskassen/app/[locale]/(authenticated)/backoffice/page.tsx`
   ```bash
   cp apps/backoffice/app/\[locale\]/page.tsx \
     apps/arbeidskassen/app/\[locale\]/\(authenticated\)/backoffice/page.tsx
   ```
   Tilpass: Fjern den egne `<Navbar>`-instansen. Sørg for at `appHrefs` bruker interne paths.

3. **Sales Portal** → `apps/arbeidskassen/app/[locale]/(authenticated)/sales-portal/page.tsx`
   ```bash
   cp apps/sales-portal/app/\[locale\]/page.tsx \
     apps/arbeidskassen/app/\[locale\]/\(authenticated\)/sales-portal/page.tsx
   ```

4. **Verifiser alle tre:**
   ```bash
   pnpm --filter @arbeidskassen/web dev
   # http://localhost:3000/no/today
   # http://localhost:3000/no/backoffice
   # http://localhost:3000/no/sales-portal
   ```

### Suksesskriterium
- Alle tre sider rendrer korrekt under `(authenticated)/`
- Commit: `feat: move today, backoffice, sales-portal into main app`

---

## Fase 6: Konsolider middleware og navigasjon

**Mål:** Forenkle middleware til én policy, oppdater navigasjonssystemet til å bruke interne paths.

### 6a: Forenkle middleware

Nåværende `apps/arbeidskassen/middleware.ts` bruker `APP_AUTH_POLICIES.arbeidskassen`. Den trenger nå å beskytte alle ruter under `/(authenticated)/`.

**Ny middleware-logikk:**

```typescript
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  defaultMiddlewareMatcher,
  handleAppSession,
} from "@arbeidskassen/supabase/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const publicPaths = new Set(["/", "/login"]);

export async function middleware(request: NextRequest) {
  const response = publicPaths.has(request.nextUrl.pathname)
    ? NextResponse.next({ request })
    : intlMiddleware(request);

  return handleAppSession(request, {
    loginPath: "/login",
    postLoginPath: "/select-tenant",
    protectedPrefixes: [
      "/dashboard",
      "/select-tenant",
      "/profil",
      "/bookdet",
      "/organisasjon",
      "/teamarea",
      "/today",
      "/backoffice",
      "/sales-portal",
    ],
  }, response);
}

export const config = {
  matcher: defaultMiddlewareMatcher,
};
```

### 6b: Forenkle `admin-links.ts`

`packages/ui/src/lib/admin-links.ts` er det mest kritiske å oppdatere. Nå trenger den ikke lenger generere URLs til separate apper.

**Endringer:**

1. **`resolveAdminAppHrefs(locale)`** — Alle paths blir interne:
   ```typescript
   export function resolveAdminAppHrefs(locale: string) {
     return {
       dashboard: `/${locale}/dashboard`,
       today: `/${locale}/today`,
       booking: `/${locale}/bookdet`,
       organization: `/${locale}/organisasjon`,
       teamarea: `/${locale}/teamarea`,
       backoffice: `/${locale}/backoffice`,
       salesPortal: `/${locale}/sales-portal`,
     };
   }
   ```
   Ingen env-variabler, ingen port-oppslag, ingen absolute URLs.

2. **`buildArbeidskassenHref(locale, path, options?)`** — Forenkles. Trenger ikke lenger vite om andre apper.

3. **`resolveInternalAdminHref(href, locale)`** — Kan forenkles dramatisk eller fjernes. Alt er interne paths nå.

4. **`resolveActiveAdminModule(pathname)`** — Oppdater pathname-matching til å fungere med `/(authenticated)/`-prefix.

5. **`buildLocalizedAppHref(base, locale, path)`** — Kan forenkles.

6. **Fjern** alle referanser til `NEXT_PUBLIC_*_APP_URL`-miljøvariabler (6 stk).

### 6c: Oppdater `(authenticated)/layout.tsx`

Den eksisterende `apps/arbeidskassen/app/[locale]/(authenticated)/layout.tsx` gjør allerede det meste riktig. Endringer:

1. Oppdater `resolveAdminAppHrefs(locale)`-kallet (fungerer med nye interne paths)
2. `moduleHrefs` i `<AuthenticatedShell>` vil automatisk peke til interne ruter
3. Fjern referanser til cross-app-navigation i `<Navbar>`

### 6d: Oppdater `next.config.ts`

Fjern hele proxy/rewrite-oppsettet:

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  transpilePackages: ["@arbeidskassen/ui", "@arbeidskassen/supabase"],
};

export default withNextIntl(nextConfig);
```

Fjernet: `proxiedApps`, `legacyAppMatcher`, `redirects()`, `rewrites()`.

### 6e: Oppdater tester

1. **`packages/ui/src/lib/admin-links.test.ts`**  
   Oppdater alle assertions til å forvente interne paths i stedet for separate app-URLs.

2. **`packages/supabase/src/middleware.test.ts`**  
   `APP_AUTH_POLICIES` kan beholdes i `packages/supabase` for bakoverkompatibilitet, men testene bør reflektere at bare én policy brukes i praksis. Eventuelt: legg til en ny `CONSOLIDATED_AUTH_POLICY`-export.

3. **Slett 6 av 7 `i18n/routing.test.ts`**  
   Behold bare `apps/arbeidskassen/i18n/routing.test.ts`.

### 6f: Fjern `[module]/[[...path]]/page.tsx`

Denne fallback-ruten i `apps/arbeidskassen/app/[locale]/[module]/[[...path]]/page.tsx` viser "coming soon"-sider for moduler. Den er ikke lenger nødvendig fordi modulene nå er reelle ruter under `(authenticated)/`.

Slett hele mappen: `apps/arbeidskassen/app/[locale]/[module]/`.

### Suksesskriterium
- Alle navigasjonslenker fungerer som interne paths
- Middleware beskytter alle moduler korrekt
- `CI=1 pnpm verify` grønt
- Ingen referanser til proxy-app-URLer
- Commit: `feat: consolidate middleware and navigation to single-app routing`

---

## Fase 7: Rydd opp i packages og config

**Mål:** Fjern app-spesifikke referanser fra delte pakker og rydd opp.

### Steg

1. **`packages/supabase/src/middleware.ts`**
   - `APP_AUTH_POLICIES`: Behold objektet for bakoverkompatibilitet men marker som deprecated, ELLER forenkle til én eksport.
   - Alternativt: eksporter en ny `defaultAuthPolicy` som brukes av den konsoliderte appen.

2. **`packages/ui/src/lib/admin-links.ts`**
   - Fjern alle `process.env.NEXT_PUBLIC_*_APP_URL`-fallbacks
   - Fjern `localhost:PORT`-mapping
   - Forenkle til rene path-baserte funksjoner

3. **`pnpm-workspace.yaml`** — Uendret (peker fortsatt til `apps/*` og `packages/*`)

4. **`turbo.json`** — Uendret (task-definisjonene er generiske)

5. **Root `package.json`** — Uendret

6. **`vercel.json`** — Uendret (peker allerede til `@arbeidskassen/web`)

7. **`.env.example`-filer**
   - Behold bare `apps/arbeidskassen/.env.example`
   - Oppdater den til å fjerne `*_APP_URL`-variabler
   - Enklere oppsett:
     ```
     NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

8. **`setup-i18n.js`** — Oppdater til å bare sette opp én app, eller marker som deprecated.

### Suksesskriterium
- Ingen ubrukte env-variabler refereres
- Alle package-exports er oppdatert
- `CI=1 pnpm verify` grønt
- Commit: `chore: clean up packages after consolidation`

---

## Fase 8: Oppdater dokumentasjon og deployment

**Mål:** Oppdater all dokumentasjon til å reflektere den nye single-app-arkitekturen.

### Dokumenter som må oppdateres

| Dokument | Endringer |
|----------|-----------|
| `AI_INSTRUCTIONS.md` | Fjern 7-app-referanser, oppdater app-matrise, oppdater arkitekturoversikt |
| `docs/ARCHITECTURE.md` | Ny seksjon om single-app med moduler, oppdater diagrammer, fjern proxy-logikk |
| `docs/LOCAL_DEVELOPMENT.md` | Fjern 7-port-matrise, oppdater til 1 port, forenkle env-oppsett |
| `docs/DEVELOPMENT_WORKFLOW.md` | Oppdater blast-radius-analyse (enklere nå), oppdater deploy-pipeline |
| `docs/I18N_THEMING_AND_WCAG.md` | Oppdater i18n-oppsett til én app, fjern per-app-meldingsstruktur |
| `docs/SECURITY_AND_COMPLIANCE.md` | Oppdater middleware-seksjon, forenkle auth-policy-dokumentasjon |
| `docs/PRODUCT_VISION_AND_BUSINESS_LOGIC.md` | Oppdater moduloversikt |
| `docs/CORE_ORGANIZATION_MODULE.md` | Oppdater stier fra egen app til rute |
| `docs/SALES_AND_PARTNERS.md` | Oppdater sales-portal-referanser |
| `docs/SUPERADMIN_AND_SUPPORT.md` | Oppdater backoffice-referanser |
| `README.md` | Oppdater prosjektbeskrivelse og getting-started |

### Ny seksjon i `ARCHITECTURE.md`: Modulstruktur

Legg til en seksjon som forklarer:
- Hvorfor vi konsoliderte (2 utviklere, ikke 15)
- Hvordan moduler er organisert som rutegrupper under `(authenticated)/`
- Hvordan **BookDet på eget domene** løses med Next.js middleware + Vercel rewrites
- Når det er riktig å splitte ut igjen (hint: når teamet vokser)

### Oppdater `LOCAL_DEVELOPMENT.md`

Ny getting-started:
```bash
# Klon og installer
git clone ... && cd arbeidskassen
pnpm install

# Start database
pnpm --filter @arbeidskassen/supabase db:start

# Start appen
pnpm --filter @arbeidskassen/web dev

# Åpne http://localhost:3000
```

Fjern: 7-port-matrise, proxy-forklaring, cross-app-navigasjon.

### Deployment

`vercel.json` trenger ingen endring — den peker allerede til `@arbeidskassen/web`. Men legg til i dokumentasjonen:

**Fremtidig BookDet-domene:**
```json
// I Vercel dashboard: bookdet.no → arbeidskassen.app
// I next.config.ts:
{
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/book/:slug*",
          destination: "/no/book/:slug*",
          has: [{ type: "host", value: "bookdet.no" }],
        },
      ],
    };
  },
}
```

### Suksesskriterium
- All dokumentasjon reflekterer single-app-arkitekturen
- `README.md` har oppdatert getting-started
- Commit: `docs: update all documentation for single-app architecture`

---

## Fase 9: Sletting og verifisering

**Mål:** Slett de 6 app-mappene og verifiser at alt fortsatt fungerer.

### Steg

1. **Slett app-mapper**
   ```bash
   rm -rf apps/bookdet
   rm -rf apps/organisasjon
   rm -rf apps/teamarea
   rm -rf apps/today
   rm -rf apps/backoffice
   rm -rf apps/sales-portal
   ```

2. **Oppdater pnpm-workspace** (hvis nødvendig — `apps/*` matcher fortsatt bare `apps/arbeidskassen`)

3. **Reinstaller avhengigheter**
   ```bash
   pnpm install
   ```

4. **Full verifisering**
   ```bash
   CI=1 pnpm verify
   ```
   - Lint: 0 feil
   - Tester: alle grønne
   - Build: OK

5. **Manuell testing i browser**
   ```bash
   pnpm --filter @arbeidskassen/web dev
   ```
   Test alle ruter:
   - `http://localhost:3000` → Landingsside
   - `http://localhost:3000/no/login` → Login
   - `http://localhost:3000/no/select-tenant` → Tenant-valg
   - `http://localhost:3000/no/dashboard` → Dashboard
   - `http://localhost:3000/no/profil` → Profil
   - `http://localhost:3000/no/bookdet` → BookDet oversikt
   - `http://localhost:3000/no/bookdet/ressurser` → Ressurser
   - `http://localhost:3000/no/organisasjon` → Virksomhet
   - `http://localhost:3000/no/organisasjon/brukere` → Brukere
   - `http://localhost:3000/no/teamarea` → Feed
   - `http://localhost:3000/no/today` → Kommer snart
   - `http://localhost:3000/no/backoffice` → Plattform-dashboard
   - `http://localhost:3000/no/sales-portal` → Salgsportal

6. **Slett backup**
   ```bash
   rm -rf _backup
   ```

7. **Squash-merge til main**
   ```bash
   git checkout main
   git merge --squash consolidate/single-app
   git commit -m "feat: consolidate 7 apps into single Next.js app

   BREAKING CHANGE: All module apps (bookdet, organisasjon, teamarea, today,
   backoffice, sales-portal) are now route groups under the main arbeidskassen
   app. Separate dev servers and proxy rewrites are removed.

   - Modules live under app/[locale]/(authenticated)/[module]/
   - Single middleware handles all auth
   - Navigation uses internal paths instead of cross-app URLs
   - i18n messages consolidated into single files
   - 1 dev server instead of 7"
   ```

### Suksesskriterium
- Bare `apps/arbeidskassen` finnes under `apps/`
- `CI=1 pnpm verify` grønt
- Alle ruter fungerer i browser
- Koden er merget til main

---

## Risiko og fallback

### Risikomatrise

| Risiko | Sannsynlighet | Konsekvens | Mitigering |
|--------|---------------|------------|------------|
| Import-stier bryter etter flytt | Høy | Lav | TypeScript-kompilering fanger dette |
| Sidebar-lenker peker feil | Medium | Lav | Manuell testing i browser |
| Middleware beskytter ikke alle ruter | Medium | Høy | Test uautentisert tilgang til alle moduler |
| i18n-nøkler mangler | Lav | Lav | Sammenlign nøkler før og etter |
| `resolveActiveAdminModule` matcher feil | Medium | Medium | Oppdater pathname-matching og test |
| Vercel build feiler | Lav | Medium | Test `pnpm build` lokalt først |

### Fallback-plan

Hvis noe går fundamentalt galt:

```bash
# Gå tilbake til pre-konsoliderings-tilstand
git checkout main
git branch -D consolidate/single-app

# _backup-mappen kan også brukes for manuell gjenoppretting
```

---

## Dokumenter som må oppdateres

### Fullstendig liste

| # | Dokument | Prioritet | Fase |
|---|----------|-----------|------|
| 1 | `AI_INSTRUCTIONS.md` | Kritisk | 8 |
| 2 | `docs/ARCHITECTURE.md` | Kritisk | 8 |
| 3 | `docs/LOCAL_DEVELOPMENT.md` | Kritisk | 8 |
| 4 | `docs/DEVELOPMENT_WORKFLOW.md` | Høy | 8 |
| 5 | `docs/I18N_THEMING_AND_WCAG.md` | Høy | 8 |
| 6 | `docs/SECURITY_AND_COMPLIANCE.md` | Høy | 8 |
| 7 | `docs/PRODUCT_VISION_AND_BUSINESS_LOGIC.md` | Medium | 8 |
| 8 | `docs/CORE_ORGANIZATION_MODULE.md` | Medium | 8 |
| 9 | `docs/SALES_AND_PARTNERS.md` | Lav | 8 |
| 10 | `docs/SUPERADMIN_AND_SUPPORT.md` | Lav | 8 |
| 11 | `docs/DEPLOYMENT.md` | Høy | 8 |
| 12 | `README.md` | Kritisk | 8 |
| 13 | `docs/CONSOLIDATION_PLAN.md` (dette dokumentet) | — | Arkiveres etter fullføring |

### Filer som slettes i fase 9

```
apps/bookdet/           (hele mappen)
apps/organisasjon/      (hele mappen)
apps/teamarea/          (hele mappen)
apps/today/             (hele mappen)
apps/backoffice/        (hele mappen)
apps/sales-portal/      (hele mappen)
_backup/                (etter verifisering)
```

### Filer som endres vesentlig

```
apps/arbeidskassen/middleware.ts          → Forenklet, 1 policy
apps/arbeidskassen/next.config.ts         → Uten proxy-rewrites
apps/arbeidskassen/messages/no.json       → Sammenslått fra alle apper
apps/arbeidskassen/messages/en.json       → Sammenslått fra alle apper
packages/ui/src/lib/admin-links.ts        → Interne paths, ingen env-variabler
packages/ui/src/lib/admin-links.test.ts   → Oppdaterte assertions
packages/supabase/src/middleware.ts        → Forenklet APP_AUTH_POLICIES
packages/supabase/src/middleware.test.ts   → Oppdaterte assertions
```

### Nye filer

```
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/layout.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/bookdet-shell.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/bookdet-section-page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/oversikt/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/sok-book/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/mine-bookinger/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/bookinger/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/ressurser/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/ressurser/ny/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/ressurser/[resourceId]/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/sjekklister/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/bookdet/innstillinger/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/layout.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/organization-shell.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/virksomhet/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/brukere/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/roller/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/struktur/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/fakturering/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/organisasjon/audit-logg/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/teamarea/layout.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/teamarea/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/teamarea/teamarea-shell.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/today/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/backoffice/page.tsx
apps/arbeidskassen/app/[locale]/(authenticated)/sales-portal/page.tsx
apps/arbeidskassen/app/actions/tenant.ts
apps/arbeidskassen/app/actions/roles.ts
apps/arbeidskassen/app/actions/members.ts
apps/arbeidskassen/app/actions/structure.ts
```
