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
│   └── arbeidskassen/           # Single Next.js app with all modules
│       ├── middleware.ts         # Unified auth middleware
│       ├── next.config.ts       # No proxy rewrites
│       ├── i18n/                # Single i18n config
│       ├── messages/            # Consolidated translations (all modules)
│       └── app/
│           └── [locale]/
│               ├── login/
│               ├── select-tenant/
│               └── (authenticated)/
│                   ├── dashboard/
│                   ├── profil/
│                   ├── bookdet/         # Booking module
│                   ├── organisasjon/    # Core org module
│                   ├── teamarea/        # Collaboration feed
│                   ├── today/           # Daily operations
│                   ├── backoffice/      # Platform admin
│                   └── sales-portal/    # Sales & partners
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

# Start the database
pnpm --filter @arbeidskassen/supabase db:start

# Start the app
pnpm --filter @arbeidskassen/web dev

# Open http://localhost:3000

# Run the monorepo quality gate before opening a PR
CI=1 pnpm verify
```

All modules are accessible under a single dev server:

| Route | Description |
| --- | --- |
| `http://localhost:3000` | Public landing page |
| `http://localhost:3000/no/login` | Shared login |
| `http://localhost:3000/no/select-tenant` | Tenant selection |
| `http://localhost:3000/no/dashboard` | Dashboard |
| `http://localhost:3000/no/bookdet` | Booking module |
| `http://localhost:3000/no/organisasjon` | Core organization module |
| `http://localhost:3000/no/teamarea` | Collaboration feed |
| `http://localhost:3000/no/today` | Daily operations |
| `http://localhost:3000/no/backoffice` | Platform admin |
| `http://localhost:3000/no/sales-portal` | Sales & partner portal |

### Environment Variables

Copy the example file and fill in your credentials:

```bash
cp apps/arbeidskassen/.env.example apps/arbeidskassen/.env.local
```

At minimum, you need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

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