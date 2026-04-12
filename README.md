# Arbeidskassen

> A B2B SaaS ecosystem providing free client-side productivity tools alongside premium, server-powered modules for Norwegian businesses.

---

## Overview

Arbeidskassen ("The Toolbox") is a modular B2B SaaS platform built as a Turborepo monorepo. The core philosophy is **"free tools at the edge, paid power on the server"**: lightweight, client-rendered utilities are offered at no cost to attract users, while advanced modules — backed by persistent storage, multi-tenant data isolation, and real-time collaboration — are available through paid subscriptions.

### Product Modules

| Module | Type | Description |
| --- | --- | --- |
| **Arbeidskassen** | Admin Hub | Public landing, shared login, and the main tenant dashboard entry point. |
| **Organisasjon** | Core Module | Source of Truth for organizational structure, user management, global settings, and cross-module access control. Included in every subscription. |
| **BookDet** | Paid Module | Full-featured appointment and resource booking system with calendar sync, availability rules, and customer-facing booking pages. |
| **Today** | Preview Module | Early daily-operations workspace for planning, coordination, and shift/task overviews. Currently shipped as a shared coming-soon shell. |
| **TeamArea** | Internal Collaboration | Feed-style collaboration workspace for updates and announcements. Currently available as a preview shell in the monorepo. |
| *Free Tools* | Client-side | Standalone utilities (calculators, converters, templates) that run entirely in the browser with zero authentication required. |
| **Backoffice** | Internal | Platform owner administration — tenant management, credit grants, system metrics. Strict GDPR data isolation. |
| **Sales Portal** | Internal | Sales partner interface — customer onboarding, portfolio tracking, commission visibility. |

---

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Server Components, Server Actions, SSR/SSG |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) | Utility-first CSS with accessible component primitives |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) | Auth, Row Level Security, Realtime, Edge Functions |
| **Payments** | [Stripe](https://stripe.com/) | Subscriptions, invoicing, usage-based billing |
| **Hosting** | [Vercel](https://vercel.com/) / [Cloudflare](https://cloudflare.com/) | Edge-first deployment, CDN, serverless functions |
| **Monorepo** | [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) | Build orchestration, workspace dependency management |

---

## Monorepo Structure

```
arbeidskassen/
├── apps/
│   ├── arbeidskassen/       # Public landing + main dashboard hub (Next.js)
│   ├── organisasjon/        # Core org structure & user management (Next.js)
│   ├── bookdet/             # Booking module (Next.js)
│   ├── today/               # Daily operations preview surface (Next.js)
│   ├── teamarea/            # Internal collaboration preview surface (Next.js)
│   ├── backoffice/          # Platform owner admin — internal only (Next.js)
│   └── sales-portal/        # Sales & partner portal (Next.js)
├── packages/
│   ├── ui/                  # Shared UI components, shells, and routing helpers
│   ├── supabase/            # Shared Supabase clients + local CLI workspace
│   └── config/              # Shared ESLint, Prettier, TypeScript configs
├── docs/                    # Architecture, product, and local setup documentation
├── _poc-imports/            # Raw prototype code staging area (never deployed)
├── turbo.json               # Turborepo pipeline configuration
├── pnpm-workspace.yaml      # pnpm workspace definition
└── package.json             # Root scripts and dev dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **Supabase CLI** (for local development)

### Installation

```bash
# Clone the repository
git clone <repo-url> arbeidskassen
cd arbeidskassen

# Install all dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Run the monorepo quality gate before opening a PR
CI=1 pnpm verify
```

| App | URL | Notes |
| --- | --- | --- |
| Arbeidskassen | `http://localhost:3000` | Public landing at `/`, shared login at `/login`, dashboard at `/{locale}/dashboard` |
| BookDet | `http://localhost:3001/no` | Canonical primary-domain path: `/{locale}/bookdet` |
| Organisasjon | `http://localhost:3002/no` | Canonical primary-domain path: `/{locale}/organisasjon` |
| Sales Portal | `http://localhost:3003/no` | Canonical primary-domain path: `/{locale}/sales-portal` |
| Today | `http://localhost:3004/no` | Preview shell for the operations workspace |
| TeamArea | `http://localhost:3005/no` | Preview collaboration shell; degrades gracefully without Supabase env vars |
| Backoffice | `http://localhost:3099/no` | Canonical primary-domain path: `/{locale}/backoffice` |

### Deployment model

The **default product model** is still a **single main app on one primary domain**:

- `/` → public Arbeidskassen landing
- `/login` → shared authentication
- `/{locale}/bookdet`, `/{locale}/organisasjon`, `/{locale}/today`, etc. → module entries under the same product

Separate per-module deploys are **optional operational infrastructure**, not a product requirement. If they are configured later through env vars like `BOOKDET_APP_URL`, the same canonical URLs can proxy there without changing what users see.

### Environment Variables

Copy the example files and fill in your credentials for the Supabase-backed apps:

```bash
cp apps/arbeidskassen/.env.example apps/arbeidskassen/.env.local
cp apps/organisasjon/.env.example apps/organisasjon/.env.local
cp apps/bookdet/.env.example apps/bookdet/.env.local
cp apps/backoffice/.env.example apps/backoffice/.env.local
cp apps/sales-portal/.env.example apps/sales-portal/.env.local
cp apps/today/.env.example apps/today/.env.local
cp apps/teamarea/.env.example apps/teamarea/.env.local
```

At minimum, these apps expect `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

For a fuller setup guide, see [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

---

## Documentation

| Document | Description |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Server/client component strategy, Server Actions, rendering model |
| [Local Development](docs/LOCAL_DEVELOPMENT.md) | Current ports, routes, env setup, Supabase CLI workflow, and verification commands |
| [Multi-Tenant Database](docs/DATABASE_MULTI_TENANT.md) | Tenant hierarchy, shared-schema isolation, RLS strategy |
| [Security & Compliance](docs/SECURITY_AND_COMPLIANCE.md) | Zero Trust architecture, audit logging, cross-tenant collaboration |
| [Product Vision & Business Logic](docs/PRODUCT_VISION_AND_BUSINESS_LOGIC.md) | Revenue model, free vs paid strategy, UX vision, B2B invoicing |
| [I18N, Theming & WCAG](docs/I18N_THEMING_AND_WCAG.md) | Internationalization, Light/Dark/custom themes, WCAG 2.1 AA compliance |
| [Core Module: Organisasjon](docs/CORE_ORGANIZATION_MODULE.md) | Organizational hierarchy, user management, global settings, access control |
| [Super Admin & Support](docs/SUPERADMIN_AND_SUPPORT.md) | Backoffice operations, GDPR data isolation, consent-based support access |
| [Sales & Partners](docs/SALES_AND_PARTNERS.md) | Sales partner model, commission logic, attribution, demo tenants |
| [POC Ingestion Workflow](docs/POC_INGESTION_WORKFLOW.md) | How to integrate external AI prototypes into the production monorepo |
| [Development Workflow](docs/DEVELOPMENT_WORKFLOW.md) | Database migrations, blast radius analysis, branching strategy, deployment |
| [Deployment Runbook](docs/DEPLOYMENT.md) | Operational deployment guide, env matrix, rollout and rollback checklist |

---

## License

Proprietary — All rights reserved.