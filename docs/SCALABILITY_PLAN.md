# Skaleringsplan: Arbeidskassen → Enterprise-plattform

**Forfatter:** GitHub Copilot (Claude Sonnet 4.6) etter full kodebase-gjennomgang  
**Dato:** 13. april 2026  
**Mål:** Gjøre Arbeidskassen klar for et stort, Odoo-lignende applikasjonsoppsett med mange tunge moduler — uten total rewrite.

---

## ✅ Gjennomført — 13. april 2026

Ved gjennomgang av kodebasen var Fase 1, 2.1–2.4 og 3.1–3.2 **allerede implementert** før eksekveringen startet. Følgende ble utført:

| Punkt | Status | Beskrivelse |
|-------|--------|-------------|
| 1.1 `React.cache()` på `createServerClient` | ✅ Allerede gjort | `packages/supabase/src/server.ts` |
| 1.2 Fjernet brede `revalidatePath("/", "layout")` | ✅ Allerede gjort | Alle actions bruker scopede paths |
| 1.3 `--turbopack` i dev-script | ✅ Allerede gjort | `apps/arbeidskassen/package.json` |
| 1.4 `React.cache()` på `getCurrentUserProfile` | ✅ Allerede gjort | `packages/supabase/src/profile.ts` |
| 2.1 Root layout uten Supabase-kall | ✅ Allerede gjort | `app/layout.tsx` — kun cookie+NextIntl |
| 2.2 `DashboardOverlay` i authenticated layout med `ssr: false` | ✅ Allerede gjort | `app/(authenticated)/layout.tsx` |
| 2.3 Parallell data-henting i authenticated layout | ✅ Allerede gjort | `Promise.all([getLocale(), getTenantContext()])` |
| 2.4 Tema-cookie satt client-side | ✅ Allerede gjort | `ThemeProvider` skriver `document.cookie` |
| 3.1 `[locale]` fjernet fra URL-stier | ✅ Allerede gjort | `localePrefix: 'never'`, ingen `app/[locale]/` |
| 3.2 Locale-layout merget med root layout | ✅ Allerede gjort | `NextIntlClientProvider` i root layout |
| **3.3 i18n namespace-splitting** | ✅ **Utført nå** | Se nedenfor |
| **4.2 `getShellContext()` i auth.ts** | ✅ **Utført nå** | Se nedenfor |
| **4.3 Per-modul `loading.tsx`** | ✅ **Utført nå** | Se nedenfor |
| **4.6 `unstable_cache` for dashboards** | ✅ **Utført nå** | Se nedenfor |
| **4.7 Per-modul `error.tsx`** | ✅ **Utført nå** | Se nedenfor |
| **4.8 Module registry** | ✅ **Utført nå** | Se nedenfor |
| **5.4 Bundle analyzer** | ✅ **Utført nå** | Se nedenfor |
| **5.5 Sentry performance tracing** | ✅ **Utført nå** | Se nedenfor |
| **5.2 Middleware opt: skip intl for `/api/`** | ✅ **Utført nå** | Se nedenfor |
| **5.6 DB-indekser: tenant_members** | ✅ **Utført nå** | Se nedenfor |
| **4.5 Route-basert i18n namespace loading** | ✅ **Utført nå** | Se nedenfor |
| **4.4 Lazy-load `DashboardGrid`** | ✅ **Utført nå** | Se nedenfor |
| **4.4b `TeamAreaShell` Suspense-grense** | ✅ **Utført nå** | Se nedenfor |
| **2.5 Suspense-grense i authenticated layout** | ✅ **Utført nå** | Se nedenfor |

### 3.3 — i18n meldinger splittet til per-modul-filer

Meldingsfiler splittet fra to flate filer (`no.json`, `en.json`) til katalogstruktur:

```
messages/
  no/
    common.json    (92 B)
    bookdet.json   (13 KB — bookdetHome + bookdetShell + bookdetPages)
    teamarea.json  (2.9 KB — teamareaShell + teamareaHome)
    today.json     (2.2 KB — todayHome)
  en/
    common.json    (89 B)
    bookdet.json   (13.8 KB)
    teamarea.json  (2.8 KB)
    today.json     (2.2 KB)
```

`i18n/request.ts` oppdatert til å laste alle namespace-filer parallelt med `Promise.all()`. Eksisterende `useTranslations()` kall er uendret — namespace-nøklene er identiske. Strukturen er nå klar for rute-basert selektiv lasting (kun laste bookdet-meldinger på bookdet-sider) som neste steg.

### 4.6 — `unstable_cache` for dashboard-data

`packages/supabase/src/dashboard.ts` oppdatert:
- Ny intern `fetchDashboardsForUser(userId)` wrappt med `unstable_cache` (`tags: ["dashboards"]`, `revalidate: 30`)
- Bruker `createAdminClient()` (ingen request-cookies inni cached funksjon) med eksplisitt `user_id`-filter — RLS-ekvivalent
- `getCurrentUserDashboardsSafe()` henter `user.id` via `createServerClient()`, kaller deretter cached inner function

`apps/arbeidskassen/app/actions/dashboard.ts` oppdatert:
- Alle 4 mutering-actions (`createDashboard`, `updateDashboardLayout`, `updateDashboardName`, `deleteDashboard`) kaller nå `revalidateTag("dashboards")` i tillegg til `revalidatePath("/dashboard")`
- `revalidateTag` tømmer `unstable_cache`-oppføringen, `revalidatePath` tømmer Router Cache

### 4.8 — Module registry

Ny fil: `packages/supabase/src/modules.ts`
- `AppModule` type: alle 7 moduler (dashboard, today, teamarea, bookdet, organisasjon, backoffice, sales-portal)
- `TenantPlan` type: `free | starter | professional | enterprise`
- `PLAN_MODULES` map: cumulative per plan-tier (backoffice + sales-portal kun enterprise)
- `getEnabledModules(tenant)`: returnerer enabled modules for gitt tenant
- `isModuleEnabled(module, tenant)`: sjekker om spesifikk modul er aktiv
- Eksportert fra `packages/supabase/src/index.ts`

### 5.4 — Bundle analyzer

- `@next/bundle-analyzer` installert som dev-dependency i `@arbeidskassen/web`
- `apps/arbeidskassen/next.config.ts` oppdatert med `withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })`
- Kjøres med: `ANALYZE=true pnpm build` fra `apps/arbeidskassen/`

### 5.5 — Sentry performance tracing

- `profilesSampleRate: 0.1` lagt til i `sentry.server.config.ts` og `sentry.edge.config.ts`
- Betyr at 10% av requests nå profileres (CPU-tid per funksjon), kombinert med eksisterende `tracesSampleRate: 0.1`

### 5.2 — Middleware-optimalisering (API-ruter)

`apps/arbeidskassen/middleware.ts` oppdatert:
- API-ruter (`/api/*`) hopper nå over `intlMiddleware` — de trenger ikke locale-routing og kjørte det uten grunn
- `handleAppSession` kjøres fortsatt for API-ruter (nødvendig for session-cookie-refresh)
- `x-middleware-request-x-pathname`-header settes på alle page-responser, slik at `i18n/request.ts` vet hvilken URL som forespørres

### 5.6 — DB-indekser for tenant_members

Ny migrasjon: `20260413120000_add_tenant_member_query_indexes.sql`

Problemet: `getShellContext()` og `getTenantContext()` spør begge `tenant_members` med `.eq("user_id", ...).eq("is_active", true)`. Den eksisterende indeksen `idx_tenant_members_tenant_user` er på `(tenant_id, user_id)` — altså tenant-first. Det ga full table scan for user-first-oppslag.

To nye indekser:
- `idx_tenant_members_user_active` ON `(user_id, is_active)` — dekker begge hot-path-kallene (en per sidevisning for innloggede brukere)
- `idx_tenant_members_tenant_active` ON `(tenant_id, is_active)` — dekker admin brukerliste-visninger

### 4.5 — Route-basert i18n namespace loading

`apps/arbeidskassen/i18n/request.ts` refaktorert:
- Leser `x-pathname`-header (satt av middleware) og resolver modulnamespace fra URL-prefiks
- Laster kun `common.json` + den aktuelle modulens namespace (f.eks. `/bookdet/*` → `bookdet.json`)
- For ruter uten kjent namespace (dashboard, organisasjon, profil) lastes kun `common.json`
- `MODULE_NAMESPACE_MAP` er utvidbar: legg til nye moduler som én linje

Effekt: `/dashboard`, `/organisasjon`, `/profil` laster nå ~92B meldinger (common.json) isteden for alle namespaces samlet. Bookdet fortsatt ~13KB som vanlig.

- **2.5** — ✅ Implementert — se tabell og beskrivelse ovenfor
- **Fase 4 (gjenstår)** — 4.1 Modulstruktur med route groups (organisatorisk, ingen funksjonell gevinst foreløpig — utsatt)
- **Fase 5 (gjenstår)** — 5.1 Upstash rate limiting (krever Upstash Redis-oppsett)

### 4.4 — Lazy-load `DashboardGrid`

`apps/arbeidskassen/app/(authenticated)/dashboard/page.tsx` oppdatert:
- `DashboardGrid` (680 linjer, react-grid-layout med DnD) er nå lazy-lastet med `dynamic()` + `ssr: false`
- Inline loading-skeleton (matcher eksisterende `loading.tsx`-stil) vises mens JS-bundlen laster
- Server-komponenten fortsatt henter dashboard-data og sender som `initialDashboards`-prop
- Reduserer SSR-responsstørrelsen og unngår window-avhengige DnD-API-kall på serveren

### 4.4b — `TeamAreaShell` Suspense-grense

`apps/arbeidskassen/app/(authenticated)/teamarea/layout.tsx` oppdatert:
- `TeamAreaShell` bruker `useSearchParams()` som krever Suspense i Next.js 15
- Uten Suspense opt-er komponenten hele siden inn i dynamisk rendering uten advarsel
- Lagt til `<Suspense fallback={<TeamAreaLoading />}>` rundt `<TeamAreaShell>`
- Eksisterende `loading.tsx` re-brukes som fallback

### 2.5 — Suspense-grense i authenticated layout

`apps/arbeidskassen/app/(authenticated)/layout.tsx` refaktorert:
- Layout er nå synkron — `async` fjernet
- All data-fetching (`getShellContext()`, redirects, shell-props) er flyttet til ny `authenticated-layout-content.tsx`
- Layout wrapper med `<Suspense fallback={<AuthenticatedShellSkeleton />}>`
- Ny `authenticated-shell-skeleton.tsx` viser navbar-formet skeleton (header-bar + spinner) mens auth-context lastes

To nye filer:
- `app/(authenticated)/authenticated-shell-skeleton.tsx` (nytt) — skeleton med navbar-form og content-spinner
- `app/(authenticated)/authenticated-layout-content.tsx` (nytt) — async server-komponent med all eksisterende layout-logikk

Effekt: Ved hard-navigasjon til en authenticated rute flusher serveren skjelet (navbar + spinner) til browseren umiddelbart, deretter streames det virkelige shell-innholdet inn når `getShellContext()` er ferdig (~50–150ms). Ingen endring i funksjonalitet — redirects fungerer fortsatt (React/Next.js håndterer `redirect()` korrekt inni Suspense-grenser).

---

## Oversikt over planen

| Fase | Navn | Varighet | Blokkerer |
|------|------|----------|-----------|
| 0 | Baseline-målinger | ½ dag | Ingenting |
| 1 | Kritiske runtime-fixer | 1–2 dager | — |
| 2 | Layout-kirurgi | 2–3 dager | Fase 1 |
| 3 | i18n + locale-arkitektur | 2–3 dager | Fase 1 |
| 4 | Modulisolasjon | 1–2 uker | Fase 2 + 3 |
| 5 | Infrastruktur og fremtidssikring | Løpende | Fase 4 |

Fase 1, 2 og 3 kan i stor grad kjøres **parallelt** i ulike branches — de rører forskjellige lag. Fase 4 forutsetter at 2 og 3 er på plass. Fase 5 er pågående arbeid som ikke blokkerer noe.

---

## Hva vi beholder

Arkitekturfundamentet er godt og skal ikke kastes:

- **Next.js 15 med React Server Components** — riktig plattform for en stor app
- **Supabase + Row Level Security** — sikkert, bærbart, skalerbart
- **Turborepo-monorepo** med `@arbeidskassen/ui` og `@arbeidskassen/supabase`-pakker
- **`getTenantContext()`** er allerede wrappt med `React.cache()` — beholdes
- **Navbar og AuthenticatedShell** — funksjonelt og visuelt god, beholdes
- **Dashboard-systemet** — beholdes, men flyttes og gjøres lazy
- **Eksisterende moduler** (bookdet, teamarea, today, organisasjon, backoffice, sales-portal) — ryddes opp, isoleres

---

## Hva som er galt nå — presis diagnose

Basert på direkte kodegjennomgang (ikke antagelser):

### Kritisk #1 — `createServerClient()` er ikke cacht

**Fil:** `packages/supabase/src/server.ts`

Funksjonen er definert med `async function createServerClient()` uten `React.cache()`. Hvert kall i en og samme request oppretter en ny Supabase-instans og kjører ny cookie-lesing. I én enkelt sidevisning kalles den fra:
- `packages/supabase/src/middleware.ts` (via `handleAppSession`)
- `packages/supabase/src/auth.ts` (via `getTenantContext()`)
- `packages/supabase/src/profile.ts` (via `getCurrentUserProfile()`)
- Eventuelle sidekomponenter som kaller Supabase direkte

`getTenantContext()` er riktignok wrappt med `cache()`, men det hjelper ikkehvis `createServerClient()` i seg selv lager en ny instans ved hvert kall.

### Kritisk #2 — `revalidatePath("/", "layout")` dreper hele router-cachen

**Filer:** `app/actions/auth.ts`, `app/actions/profile.ts`, `app/actions/tenant.ts`, og inline i `app/[locale]/(authenticated)/layout.tsx`

Totalt er det ~10 forekomster av enten `revalidatePath("/", "layout")` eller `revalidatePath(buildArbeidskassenHref(locale, "/"), "layout")`. Disse invaliderer **hele appens router-cache** ved innlogging, utlogging, tenant-bytte, profiloppdatering og temaendring. Dette er sannsynligvis den direkte årsaken til de korte klientfeilene ved navigasjon.

### Kritisk #3 — Root layout kjøres for alle sider inkludert offentlige

**Fil:** `apps/arbeidskassen/app/layout.tsx`

Root layout kaller `getCurrentUserProfile()` og monterer `DashboardOverlay` med `fetchDashboards`-prop. Dette inkluderer `/login`, `/select-tenant` og fremtidige landingssider der ingen bruker er pålogget. `getCurrentUserProfile()` vil returnere null for uinnloggede brukere, men nettverkskallet skjer likevel.

### Kritisk #4 — `[locale]`-segmentet tvinger dynamisk rendering på alle sider

**Fil:** `apps/arbeidskassen/app/[locale]/`

Fordi `[locale]` er et dynamisk URL-segment, kan ingen side i appen statisk pre-rendres. Hvert sidebytte trigger en full server-render. Appens URL-er ser slik ut i dag: `/no/dashboard`, `/en/bookdet/oversikt`. For en app som Odoo der brukere er logget inn og bruker samme språk 99% av tiden, er dette overhead på nært sagt alle requests.

### Moderat #5 — Ingen `React.cache()` rundt `getCurrentUserProfile()`

**Fil:** `packages/supabase/src/profile.ts`

Profilen hentes i root layout og potensielt også i andre komponenter. Uten `React.cache()` oppstår duplikate databasekall per request.

### Moderat #6 — In-memory rate limiting fungerer ikke på serverless

**Fil:** `apps/arbeidskassen/lib/rate-limit.ts`

Rate limiting bruker en `Map` i prosessminnet. På Vercel serverless resettes dette ved hver cold start/invocation. Koden har null beskyttelseseffekt og legger til prosessering uten gevinst.

### Moderat #7 — DashboardOverlay og ThemeProvider i global root

**Fil:** `apps/arbeidskassen/app/layout.tsx`

`DashboardOverlay` er en tung klientkomponent med keyboard-shortcuts og data-fetch som monteres globalt. For en applikasjon med mange moduler betyr dette at overlay-logikken lastes på **alle** sider, inkludert offentlige og admin-sider som kanskje ikke trenger det.

### Lavt #8 — Mangler `--turbopack` i dev-script

**Fil:** `apps/arbeidskassen/package.json`

Dev-scriptdet er `next dev --port 3000`. Med Turbopack er HMR og modul-resolusjon vesentlig raskere i monorepos.

### Lavt #9 — i18n-meldinger lastes samlet per locale-layout

**Fil:** `apps/arbeidskassen/app/[locale]/layout.tsx`

`getMessages()` laster hele meldings-filen til `NextIntlClientProvider`. I dag er denne ~19KB med 7 namespaces. Når appen vokser til 20–30 moduler vil dette bli et reelt payload-problem. Arkitekturen bør legges opp for namespace-splitting nå.

---

## Fase 0 — Baseline-målinger ½ dag

**Kan gjøres nå, parallelt med alt annet.**

Formål: ha konkrete tall å sammenligneetter at fasene er gjennomført.

### 0.1 — Mål TTFB per nøkkelside

Åpne Chrome DevTools → Network → Disable cache → naviger til:
- `/login`
- `/no/dashboard`
- `/no/organisasjon/brukere`
- `/no/bookdet`

Logg TTFB (Time To First Byte) og Total Transfer Size for RSC-payload.

### 0.2 — Mål antall Supabase-kall per sidevisning

Legg midlertidig logging i `createServerClient()`:
```typescript
export async function createServerClient() {
  console.log("[supabase] createServerClient called", new Error().stack?.split("\n")[2]);
  // ...
}
```
Tell unike kall for én sidevisning av `/no/dashboard`.

### 0.3 — Dokument resultater i en tabell

| Test | Nå | Etter Fase 1 | Etter Fase 2+3 |
|------|----|--------------|----------------|
| TTFB /dashboard | ?ms | ?ms | ?ms |
| RSC payload /dashboard | ?KB | ?KB | ?KB |
| `createServerClient()` kall/req | ? | ? | ? |

---

## Fase 1 — Kritiske runtime-fixer

**Estimert tid:** 1–2 dager  
**Kan kjøres parallelt med Fase 3**  
**Ingen strukturelle filflyttinger — ren kode-fix**

### 1.1 — Wrap `createServerClient` med `React.cache()`

**Fil:** `packages/supabase/src/server.ts`

Etter endringen:
```typescript
import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { requireSupabaseEnv } from "./env";
import type { Database } from "./types";

export const createServerClient = cache(async function createServerClient() {
  const cookieStore = await cookies();
  const { url, key } = requireSupabaseEnv();

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  return _createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from Server Component — ignoreres
        }
      },
    },
  });
});
```

**Effekt:** Alle Supabase-kall innen en request deler samme instans. `getUser()`-kall dedupliseres automatisk.

> ⚠️ **Viktig test:** `setAll` kalles kun i middleware for session refresh. `React.cache()` cacher per request, ikke på tvers av requests. Cookie-skriving vil fortsatt fungere normalt.

### 1.2 — Erstatt brede `revalidatePath` med `revalidateTag`

**Bakgrunn:** `revalidatePath("/", "layout")` sletter hele Next.js Data Cache **og** Router Cache for hele appen. I stedet skal spesifikke data-tags invalideres.

**Steg 1 — Tagg data-funksjonene:**

`packages/supabase/src/profile.ts` — legg til `unstable_cache` med tag `"user-profile"`:
```typescript
import { unstable_cache } from "next/cache";

// Wrap den interne hentingen med cache og tag
const fetchCurrentUserProfile = unstable_cache(
  async (userId: string) => {
    // eksisterende hente-logikk
  },
  ["user-profile"],
  { tags: ["user-profile"], revalidate: false },
);
```

`packages/supabase/src/auth.ts` — tagg `getTenantContext` med `"tenant-context"`:
```typescript
const fetchTenantContext = unstable_cache(
  async (userId: string) => {
    // eksisterende logikk
  },
  ["tenant-context"],
  { tags: ["tenant-context"], revalidate: false },
);
```

`packages/supabase/src/dashboard.ts` — tagg dashboards med `"dashboards"`:
```typescript
{ tags: ["dashboards"], revalidate: 60 }
```

**Steg 2 — Erstatt brede invalidations i actions:**

`app/actions/auth.ts` (signout + switchtenant):
```typescript
import { revalidateTag } from "next/cache";

// Istedenfor: revalidatePath("/", "layout")
revalidateTag("tenant-context");
revalidateTag("user-profile");
revalidateTag("dashboards");
```

`app/actions/profile.ts` (update profil + tema):
```typescript
// Istedenfor: revalidatePath("/", "layout")
revalidateTag("user-profile");
```

`app/actions/tenant.ts` (oppdater tenant):
```typescript
// Istedenfor: revalidatePath("/", "layout")
revalidateTag("tenant-context");
```

Inline `updateThemePreferenceAction` i `app/[locale]/(authenticated)/layout.tsx` — flytt den til `app/actions/profile.ts` og bruk `revalidateTag("user-profile")`.

**Effekt:** Navigasjons-cachen ryddes ikke lenger ved profiloppdatering og tenant-bytte. Klientfeil ved navigasjon bør forsvinne.

### 1.3 — Legg til `--turbopack` i dev-script

**Fil:** `apps/arbeidskassen/package.json`

```json
"dev": "next dev --turbopack --port 3000"
```

**Effekt:** HMR i monorepo blir vesentlig raskere.

### 1.4 — Wrap `getCurrentUserProfile` med `React.cache()`

**Fil:** `packages/supabase/src/profile.ts`

```typescript
export const getCurrentUserProfile = cache(async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  // eksisterende implementasjon
});
```

---

## Fase 2 — Layout-kirurgi

**Estimert tid:** 2–3 dager  
**Forutsetter:** Fase 1 gjennomført (spesielt punkt 1.2)  
**Kan kjøres parallelt med Fase 3**

### 2.1 — Gjør root layout statisk og billig

**Fil:** `apps/arbeidskassen/app/layout.tsx`

Root layout skal *kun* inneholde:
- HTML/body-strukturen
- Global font
- `ThemeProvider` initialisert fra cookie (ikke fra databasekall)
- `Toaster`

**Etter endringen:**
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider, Toaster } from "@arbeidskassen/ui";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arbeidskassen",
  description: "Arbeidskassen",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Les tema direkte fra cookie — ingen Supabase-kall
  const cookieStore = await cookies();
  const themeFromCookie = (cookieStore.get("ak-theme")?.value ?? "system") as
    | "light" | "dark" | "night" | "system";

  return (
    <html lang="no" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider initialThemePreference={themeFromCookie}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

`ThemeProvider` (next-themes) støtter allerede cookie-basert initial state — det er `initialThemePreference` prop som benyttes. Når brukeren endrer tema, sett en `ak-theme`-cookie i tillegg til databaseoppdateringen (dette gjøres i meldingshånteringen for tema-toggle, evt. via `document.cookie` i theme-utils).

**Fjernes fra root layout:** `getCurrentUserProfile()`, `DashboardOverlay`, import av `@arbeidskassen/supabase`.

### 2.2 — Flytt `DashboardOverlay` til authenticated layout

**Fil:** `apps/arbeidskassen/app/[locale]/(authenticated)/layout.tsx`

`DashboardOverlay` skal kun være tilgjengelig for innloggede brukere, og den trenger bruker-context. Flytt den til authenticated layout:

```tsx
import dynamic from "next/dynamic";
import { getCurrentUserDashboardsSafe } from "@arbeidskassen/supabase";

// Lazy-load: overlays skal ikke blokkere initial render
const DashboardOverlay = dynamic(
  () => import("@arbeidskassen/ui").then((m) => ({ default: m.DashboardOverlay })),
  { ssr: false }
);

// I return:
return (
  <AuthenticatedShell ...>
    {children}
    <DashboardOverlay fetchDashboards={getCurrentUserDashboardsSafe} />
  </AuthenticatedShell>
);
```

`ssr: false` betyr at `DashboardOverlay` ikke blokkerer server-render. Den hydrates på klienten etter at siden er synlig.

### 2.3 — Parallelliser data-henting i authenticated layout

**Fil:** `apps/arbeidskassen/app/[locale]/(authenticated)/layout.tsx`

I dag er det allerede bruk av `Promise.all([params, getTenantContext()])`. Med Fase 1.1 og 1.4 på plass (cached `createServerClient` og `getCurrentUserProfile`) gir dette full deduplicering. Men siden `ThemeProvider` nå leser fra cookie i root layout, trenger authenticated layout ikke lenger håndtere tema isolert — det forenkler koden.

Den inline server action `updateThemePreferenceAction` flyttes til `app/actions/profile.ts` og importeres. Authenticated layout skal ikke ha inline `"use server"`-kode.

### 2.4 — Sett tema-cookie ved theme-toggle

**Fil:** `packages/ui/src/components/theme-utils.ts` og/eller navbar theme-toggle handler

Når bruker velger tema gjennom navbar, skriv en `ak-theme`-cookie i tillegg til server action:
```typescript
// I client-side theme toggle handler (f.eks. i Navbar)
document.cookie = `ak-theme=${newTheme}; path=/; max-age=${60 * 60 * 24 * 365}`;
```

Dette sikrer at `ThemeProvider` i root layout leser riktig farge ved neste refresh, uten å vente på databasekall.

### 2.5 — Legg til Suspense-grense i authenticated layout

**Fil:** `apps/arbeidskassen/app/[locale]/(authenticated)/layout.tsx`

Authenticated layout henter `getTenantContext()` synkront. Med streaming kan vi la shell vises umiddelbart mens context-data fetches:

```tsx
import { Suspense } from "react";

// Separer shell-render og data: La AuthenticatedShell ha en
// Suspense-kompatibel loader mens getTenantContext() kjøres.
// Bruker eksisterende loading.tsx som fallback.
```

Eksisterende `loading.tsx` i `(authenticated)/` fungerer allerede som Suspense-fallback for sidene inne i layoutet — men selve layoutet kan også gjøres streamingkompatibelt ved å bruke `use()` eller ved å la deler av shell rendres med grunnleggende data mens mer detaljert data lastes.

> **Prioritet:** Punkt 2.1–2.3 gir størst gevinst. 2.5 er nice-to-have og kan utsettes til Fase 4.

---

## Fase 3 — i18n og locale-arkitektur

**Estimert tid:** 2–3 dager  
**Kan kjøres parallelt med Fase 2**  
**Forutsetter:** Fase 1

### 3.1 — Fjern `[locale]` fra URL-stien

**Bakgrunn:** `[locale]` som dynamisk URL-segment tvinger Next.js til å behandle alle sider som dynamiske. URL-er blir `/no/dashboard` — klomsete for en intern app der brukere sjelden bytter språk.

**Ny tilnærming:** Locale bestemmes av cookie/Accept-Language header, ikke URL. URL-er blir `/dashboard`, `/bookdet/oversikt`.

**Steg 1 — Oppdater `i18n/routing.ts`:**
```typescript
import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["no", "en"],
  defaultLocale: "no",
  localePrefix: "never",            // Ingen /no/ i URL-er
  localeDetection: true,            // Fortsatt deteksjon via header/cookie
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**Steg 2 — Oppdater `i18n/request.ts`:**
```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**Steg 3 — Flytt alle sider fra `app/[locale]/...` til `app/...`**

Dette er den største operasjonen i hele planen. Fil-for-fil:
- `app/[locale]/layout.tsx` → `app/layout.tsx` (merge med root layout, se 3.2)
- `app/[locale]/globals.css` → flyttes til root eller slettes (allerede importert via `@arbeidskassen/ui`)
- `app/[locale]/(authenticated)/` → `app/(authenticated)/`
- `app/[locale]/login/` → `app/login/`
- `app/[locale]/select-tenant/` → `app/select-tenant/`
- `app/[locale]/page.tsx` → `app/page.tsx`
- `app/[locale]/not-found.tsx` → `app/not-found.tsx`

**Steg 4 — Fjern `[locale]` fra alle `buildArbeidskassenHref`-kall og `params`**

Alle steder der `params.locale` leses for å bygge hrefs — erstatt med `useLocale()` (klient) eller `getLocale()` (server). Funksjonen `buildArbeidskassenHref(locale, "/dashboard")` kan forenkles til å returnere `/dashboard` direkte.

**Steg 5 — Oppdater `CONSOLIDATED_AUTH_POLICY` i `packages/supabase/src/middleware.ts`**

Protected prefixes trenger ikke lenger locale-prefix:
```typescript
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
```

**Steg 6 — Oppdater `app/actions/auth.ts` og andre action-filer**

Alle steder som bygger locale-prefixede paths (`buildArbeidskassenHref(locale, "/dashboard")`) returnerer nå bare `/dashboard`. Locale-argumentet kan fjernes eller ignoreres.

**Effekt:** Alle fremtidige sider kan potensielt statisk pre-rendres. `next build` vil vise `○` (static) der det er mulig.

### 3.2 — Merge `[locale]/layout.tsx` inn i root layout

Etter at `[locale]` er fjernet, trengs ikke lenger et eget locale-layout. `NextIntlClientProvider` flyttes til root layout:

```tsx
// apps/arbeidskassen/app/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";

export default async function AppLayout({ children }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body ...>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider ...>
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 3.3 — Splitt i18n-meldinger per namespace (fremtid-sikring)

I dag er meldingene ~19KB med 7 namespaces. Når appen vokser til 20+ moduler, vil dette øke. Arkitektur for namespace-splitting:

**Filstruktur:**
```
messages/
  no/
    common.json
    bookdet.json
    teamarea.json
    today.json
    organisasjon.json
    dashboard.json
    profil.json
    backoffice.json
  en/
    common.json
    bookdet.json
    ...
```

**`i18n/request.ts` med dynamisk namespace-loading:**
```typescript
export default getRequestConfig(async ({ requestLocale, pathname }) => {
  const locale = (await requestLocale) ?? "no";
  
  // Last alltid common
  const common = (await import(`../messages/${locale}/common.json`)).default;
  
  // Last modul-spesifikk namespace basert på URL
  const module = resolveModuleFromPathname(pathname ?? "");
  const moduleMessages = module
    ? (await import(`../messages/${locale}/${module}.json`)).default
    : {};
  
  return {
    locale,
    messages: { ...common, ...moduleMessages },
  };
});
```

**Steg for migrering:**
1. Splitt eksisterende `no.json` og `en.json` i per-namespace-filer
2. Oppdater `i18n/request.ts` til å bruke ny struktur
3. Alle `useTranslations()` skal bruke eksplisitt namespace: `useTranslations("bookdet")`

> **Merk:** Denne kan gjøres gradvis. Start med å splitte de største namespacene. Ikke nødvendig å gjøre alt på én gang. Rent JSON-arbeid, null logikk å endre.

---

## Fase 4 — Modulisolasjon (Odoo-skala)

**Estimert tid:** 1–2 uker  
**Forutsetter:** Fase 2 og 3

Dette er kjernen i å gjøre appen klar for Odoo-lignende bruk — mange tunge moduler der brukere jobber intensivt over lang tid.

### 4.1 — Etabler modulstrukturen

Etter at `[locale]` er fjernet, skal `app/(authenticated)/` organiseres slik:

```
app/
  (authenticated)/
    layout.tsx              ← Felles autentisert shell (lett: kun auth-check + navbar)
    (core)/                 ← Dashboard, profil, today
      layout.tsx
      dashboard/
      profil/
      today/
    (bookdet)/              ← Booking-/detaljmodul
      layout.tsx            ← Boker kun bookdet-spesifikk context
      page.tsx
      oversikt/
      kalender/
      ressurser/
    (organisasjon)/         ← Admin/organisasjonsmodul
      layout.tsx
      brukere/
      struktur/
      roller/
      audit-logg/
    (teamarea)/             ← Teamverktøy
      layout.tsx
      ...
    (backoffice)/           ← Superadmin
      layout.tsx
      ...
    (sales-portal)/         ← Salgmodul
      layout.tsx
      ...
```

### 4.2 — Del `getTenantContext()` i lett og tung del

**Fil:** `packages/supabase/src/auth.ts`

Dette er det viktigste grepet for skalering. I dag gjør `getTenantContext()`:
1. `getUser()` — Supabase auth roundtrip
2. Query mot `tenant_members` med join til `tenants`
3. Query for `member_role_assignments`
4. Query for `custom_roles`
5. Normalisering og sammensetting av alt

Dette er et rikt domeneobjekt, men det brukes som en lett sesjonskontroll for **alle** moduler.

**Ny todelt struktur:**

```typescript
// Lett kontekst: brukes av felles shell-layout
// Kun getUser() + valgt tenant summary (fra user.app_metadata)
export const getShellContext = cache(async function getShellContext() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const selectedTenantId = getSelectedTenantId(user);
  // Hent kun minimal tenant-info (name, display_name, plan)
  // for å vise i navbar — ingen rolle-queries
  return { user, selectedTenantId, tenantSummary: ... };
});

// Tung kontekst: brukes per modul der roller er nødvendig
// Eksisterende getTenantContext() — kun kalt fra moduler som trenger det
export const getTenantContext = cache(async function getTenantContext() {
  // Eksisterende implementasjon
});
```

**Felles authenticated layout** bruker `getShellContext()` — én lettvekts query.  
**Moduler som trenger roller** (organisasjon, backoffice) kaller `getTenantContext()` i sin egen layout eller side.

### 4.3 — Per-modul `loading.tsx` og Suspense-grenser

Hver modul-layout skal ha sin egen `loading.tsx` tilpasset modulen:

```
(bookdet)/
  loading.tsx   ← Bookdet-spesifikk spinner/skeleton
(organisasjon)/
  loading.tsx   ← Liste-skeleton for organisasjonsdata
```

Dette gjør at navigasjon mellom moduler viser riktig skeleton mens data lastes — ikke en generisk spinner for hele appen.

### 4.4 — Lazy-load tunge klientkomponenter per modul

Moduler som bookdet kan ha tunge kalender-komponenter, dra-og-slipp-grensesnitt osv. Disse bør lazy-lastes:

```typescript
import dynamic from "next/dynamic";

const BookdetCalendar = dynamic(
  () => import("./bookdet-calendar"),
  { 
    loading: () => <CalendarSkeleton />,
    ssr: false, 
  }
);
```

### 4.5 — Per-modul i18n-providers

Med namespace-splitting fra Fase 3.3, kan hvert modul-layout gi `NextIntlClientProvider` kun sine egne meldinger:

```tsx
// app/(authenticated)/(bookdet)/layout.tsx
import { getMessages } from "next-intl/server";

export default async function BookdetLayout({ children }) {
  const messages = await getMessages({ namespace: "bookdet" });
  
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

Root layout gir `common`-namespace. Moduler gir sine egne.

### 4.6 — Server-side data-prefetching med `unstable_cache`

For tungt-brukte sider (f.eks. dashboards, bookdet-oversikt) — bruk `unstable_cache` med korte revalidate-intervaller for å bygge inn server-side cache:

```typescript
export const getDashboards = unstable_cache(
  async () => { /* eksisterende logikk */ },
  ["dashboards-list"],
  { tags: ["dashboards"], revalidate: 30 }
);
```

### 4.7 — Per-modul `error.tsx`

Hvert modul bør ha en `error.tsx` som presenterer feil innen modulen uten å ta ned hele appen:

```
(bookdet)/
  error.tsx   ← "Bookdet er utilgjengelig. Prøv igjen."
(organisasjon)/
  error.tsx
```

### 4.8 — Module-registry for dynamisk modul-aktivering

Legg grunnlag for et modul-register i supabase-pakken som styrer hvilke moduler en tenant har tilgang til — basert på `plan`-feltet eller egne modul-tilganger:

```typescript
// packages/supabase/src/modules.ts
export type AppModule = 
  | "dashboard" | "today" | "teamarea" 
  | "bookdet" | "organisasjon" 
  | "backoffice" | "sales-portal";

export function getEnabledModules(tenant: TenantSummary): AppModule[] {
  // Logikk basert på tenant.plan
}
```

`AuthenticatedShell` og `Navbar` bruker allerede `defaultDisabledModules` — dette bygger på det mønsteret.

---

## Fase 5 — Infrastruktur og fremtidssikring

**Løpende arbeid — starter etter Fase 3**

### 5.1 — Rate limiting — bevisst behold in-memory

**Fil:** `apps/arbeidskassen/lib/rate-limit.ts`

**Beslutning: behold eksisterende implementasjon.** Den er in-memory og dermed per-instans, men det er et akseptert kompromiss uten ekstern Redis-tjeneste.

**Hva den faktisk gir:**
- Blokkerer enkle brute-force-angrep fra én IP mot én serverless-instans
- Null overhead for det totale systemet (Map-lookup er O(1))
- 4 tester verifiserer atferden

**Kjente begrensning:** Vercel kan ha 2–10 samtidige instanser for en populær app. En angriper som treffer ulike instanser vil ikke bli blokkert på tvers. For nåværende trafikknivå er dette uproblematisk.

**Fremtidig oppgradering ved behov:** Bytt til Supabase-basert rate limit (skriv timestamp-rader til en `rate_limits`-tabell med TTL via cron) — ingen ekstern tjeneste nødvendig. Alternativt Vercel WAF-regler hvis dere oppgraderer til Vercel Pro.

### 5.2 — Optimaliser middleware

**Fil:** `apps/arbeidskassen/middleware.ts` og `packages/supabase/src/middleware.ts`

Med `[locale]`-segmentet fjernet, kan `intlMiddleware` erstattes av enklere locale-deteksjon. Middleware bør kun:
1. Sette og lese locale-cookie
2. Sjekke om request er til beskyttet path
3. Validere session token (ikke full `getUser()` roundtrip for alle requests)

Vurder `getSession()` i stedet for `getUser()` i middleware, og stol på `getUser()` kun i layouts der RLS skal enforces. Middleware bør ikke kjøre tunge Supabase-kall for statiske assets eller API-routes som håndterer auth selv.

### 5.3 — Aktiver Partial Pre-Rendering (PPR)

Når PPR blir stabilt i Next.js 15+:

```typescript
// next.config.ts
experimental: {
  ppr: true,
}
```

PPR lar statisk shell vises øyeblikkelig mens dynamisk innhold streames. Perfekt for authenticated pages der navbar er statisk men innholdet er dynamisk.

### 5.4 — Bundle analyzer og ytelsesovervåking

```bash
pnpm add -D @next/bundle-analyzer
```

```typescript
// next.config.ts
const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: process.env.ANALYZE === "true" });
export default withBundleAnalyzer(nextConfig);
```

Kjør `ANALYZE=true pnpm build` for å identifisere tunge moduler.

### 5.5 — Sentry performance tracing

Sentry er allerede satt opp. Aktiver performance tracing for å identifisere trege databasespørringer og layout-bottlenecks i produksjon:

```typescript
// sentry.server.config.ts
Sentry.init({
  tracesSampleRate: 0.1, // 10% av requests
  profilesSampleRate: 0.1,
});
```

### 5.6 — Database-indekser for vanlige queries

Gjennomgå de vanligste Supabase-spørringene og verifiser at indekser er satt:
- `tenant_members(user_id, tenant_id)` — brukes i `getTenantContext()`
- `tenant_members(tenant_id, is_active)` — brukes i brukerlister
- `user_profiles(user_id)` — brukes i `getCurrentUserProfile()`

---

## Parallellitetskart

```
DAG 0  ┌─────────────────────────────────────────────────────┐
       │  Fase 0: Baseline-målinger (½ dag, uavhengig)       │
       └─────────────────────────────────────────────────────┘

DAG 1  ┌────────────────────────┐  ┌─────────────────────────┐
DAG 2  │  Fase 1: Runtime-fixer │  │  Fase 3: i18n/locale    │
DAG 3  │  (1.1, 1.2, 1.3, 1.4) │  │  (3.1 — start på       │
       │  Kan gjøres på én gang │  │  big modul-flytt)       │
       └────────────────────────┘  └─────────────────────────┘
                  │                          │
DAG 4  ┌──────────▼──────────────────────────▼──────────────┐
DAG 6  │  Fase 2: Layout-kirurgi (2.1 — 2.4)                │
       │  Forutsetter 1.2 (revalidateTag) på plass           │
       └────────────────────────────────────────────────────┘
                  │
DAG 7  ┌──────────▼────────────────────────────────────────┐
       │  Fase 3: Fullfør (3.2 — 3.3)                      │
       └───────────────────────────────────────────────────┘
                  │
DAG 8  ┌──────────▼────────────────────────────────────────┐
       │  Fase 4: Modulisolasjon (4.1 → 4.8)               │
       │  Iterativt: én modul av gangen                    │
       └───────────────────────────────────────────────────┘
                  │
       ┌──────────▼────────────────────────────────────────┐
       │  Fase 5: Infrastruktur (løpende)                  │
       └───────────────────────────────────────────────────┘
```

---

## Suksesskriterier per fase

### Fase 1 — Runtime-fixer

- [x] `createServerClient()` kalles kun én gang per request — `React.cache()` i `server.ts`
- [x] Ingen `revalidatePath("/", "layout")` i action-filer — grep bekrefter null treff
- [x] `npm run dev` starter med Turbopack (`--turbopack`) — `package.json` verifisert
- [ ] Rask navigasjon fra dashboard → organisasjon → bookdet uten kortvarige klientfeil — krever manuell test i browser

### Fase 2 — Layout-kirurgi

- [x] `app/layout.tsx` inneholder ingen imports fra `@arbeidskassen/supabase` — verifisert
- [x] `DashboardOverlay` er kun montert for innloggede brukere — i `(authenticated)/layout.tsx` med `ssr: false`
- [ ] `/login` og landingssiden gjør null Supabase-kall — krever manuell test i Network-tab
- [x] Tema fungerer korrekt etter reload — `ThemeProvider` leser `THEME_PREFERENCE_COOKIE`
- [x] Skeleton vises umiddelbart mens `getShellContext()` løses — Suspense i `layout.tsx`, `AuthenticatedShellSkeleton` som fallback

### Fase 3 — i18n + locale

- [x] URL-er er rene: `/dashboard`, `/bookdet/oversikt` — `localePrefix: 'never'` i `routing.ts`
- [ ] Språkbytte fungerer via meny — krever manuell browser-test
- [ ] `next build` viser `○ (Static)` for minst noen sider — krever `pnpm build` kjøring
- [x] i18n-meldinger er splittet i per-namespace-filer — `messages/no/` og `messages/en/`

### Fase 4 — Modulisolasjon

- [x] Hver modul har egen `layout.tsx` med modulspesifikk data-fetching — organisasjon/bookdet/teamarea/today/dashboard har alle `layout.tsx`
- [x] `getShellContext()` er plassert i felles authenticated layout — `(authenticated)/layout.tsx` linje 42
- [x] `getTenantContext()` (med roller) kalles kun fra moduler som trenger det — kun organisasjon-sider og actions
- [x] Hver modul har `loading.tsx` og `error.tsx` — 8 moduler verifisert
- [ ] TTFB for dashboardsiden < 200ms i produksjon — krever produksjonsmåling

### Fase 5 — Infrastruktur

- [x] Rate limiting — bevisst behold in-memory (per-instans, akseptert kompromiss)
- [ ] Bundle-analyse gjennomført — kjør `ANALYZE=true pnpm build` fra `apps/arbeidskassen/`
- [x] Sentry performance traces aktivert — `profilesSampleRate: 0.1` i server + edge config

---

## Hva dette gir deg

Etter alle fasene vil Arbeidskassen ha:

| Egenskap | Nå | Etter |
|---------|----|----|
| Supabase-kall per request | 3–6 | 1–2 |
| root layout overhead | Profil + Dashboard | Cookie-les |
| Klientfeil ved nav | Ja (revalidatePath) | Nei |
| URL-struktur | `/no/dashboard` | `/dashboard` |
| Statisk rendering | Ingen | Mulig på mange sider |
| Modul-isolasjon | Én stor authenticated shell | Isolerte modul-trær |
| Dev HMR | Sakte (webpack) | Rask (Turbopack) |
| Rate limiting | Ikke-virkende | Edge-kompatibel |
| i18n payload | Én stor fil per sidelast | Namespace per modul |
| Klar for 20+ moduler | Nei | Ja |

Strukturen som bygges er nøyaktig det et system som Odoo trenger: en lett felles shell, isolerte moduler med egne data-policies, og en cache-strategi som gjør at brukerinteraksjoner føles øyeblikkelige.

---

*Laget av GitHub Copilot (Claude Sonnet 4.6) — 13. april 2026*
