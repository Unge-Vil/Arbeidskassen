# Arbeidskassen

> A B2B SaaS ecosystem providing free client-side productivity tools alongside premium, server-powered modules for Norwegian businesses.

---

## Overview

Arbeidskassen ("The Toolbox") is a modular B2B SaaS platform built as a Turborepo monorepo. The core philosophy is **"free tools at the edge, paid power on the server"**: lightweight, client-rendered utilities are offered at no cost to attract users, while advanced modules — backed by persistent storage, multi-tenant data isolation, and real-time collaboration — are available through paid subscriptions.

### Product Modules

| Module | Type | Description |
| --- | --- | --- |
| **Arbeidskassen** | Admin Panel | Central dashboard for tenant administration, billing, user management, and module provisioning. |
| **Organisasjon** | Core Module | Source of Truth for organizational structure, user management, global settings, and cross-module access control. Included in every subscription. |
| **BookDet** | Paid Module | Full-featured appointment and resource booking system with calendar sync, availability rules, and customer-facing booking pages. |
| **Today** *(planned)* | Paid Module | Daily operations dashboard — task boards, shift planning, and team communication. |
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
│   ├── arbeidskassen/       # Admin panel & main application (Next.js)
│   ├── organisasjon/       # Core org structure & user management (Next.js)
│   ├── bookdet/             # Booking module (Next.js)
│   ├── backoffice/          # Platform owner admin — internal only (Next.js)
│   └── sales-portal/        # Sales & partner portal (Next.js)
├── packages/
│   ├── ui/                  # Shared UI components (shadcn/ui)
│   ├── supabase/            # Database clients, types, and helpers
│   └── config/              # Shared ESLint, Prettier, TypeScript configs
├── docs/                    # Architecture and design documentation
├── _poc-imports/             # Raw prototype code staging area (never deployed)
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
```

| App | URL |
| --- | --- |
| Arbeidskassen (Admin) | `http://localhost:3000` |
| BookDet (Booking) | `http://localhost:3001` |
| Organisasjon (Core) | `http://localhost:3002` |
| Backoffice (Internal) | `http://localhost:3099` |
| Sales Portal | `http://localhost:3003` |

### Environment Variables

Copy the example files and fill in your credentials:

```bash
cp apps/arbeidskassen/.env.example apps/arbeidskassen/.env.local
cp apps/organisasjon/.env.example apps/organisasjon/.env.local
cp apps/bookdet/.env.example apps/bookdet/.env.local
cp apps/backoffice/.env.example apps/backoffice/.env.local
cp apps/sales-portal/.env.example apps/sales-portal/.env.local
```

Required variables are documented in each app's `.env.example`.

---

## Documentation

| Document | Description |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Server/client component strategy, Server Actions, rendering model |
| [Multi-Tenant Database](docs/DATABASE_MULTI_TENANT.md) | Tenant hierarchy, shared-schema isolation, RLS strategy |
| [Security & Compliance](docs/SECURITY_AND_COMPLIANCE.md) | Zero Trust architecture, audit logging, cross-tenant collaboration |
| [Product Vision & Business Logic](docs/PRODUCT_VISION_AND_BUSINESS_LOGIC.md) | Revenue model, free vs paid strategy, UX vision, B2B invoicing |
| [I18N, Theming & WCAG](docs/I18N_THEMING_AND_WCAG.md) | Internationalization, Light/Dark/custom themes, WCAG 2.1 AA compliance |
| [Core Module: Organisasjon](docs/CORE_ORGANIZATION_MODULE.md) | Organizational hierarchy, user management, global settings, access control |
| [Super Admin & Support](docs/SUPERADMIN_AND_SUPPORT.md) | Backoffice operations, GDPR data isolation, consent-based support access |
| [Sales & Partners](docs/SALES_AND_PARTNERS.md) | Sales partner model, commission logic, attribution, demo tenants |
| [POC Ingestion Workflow](docs/POC_INGESTION_WORKFLOW.md) | How to integrate external AI prototypes into the production monorepo |
| [Development Workflow](docs/DEVELOPMENT_WORKFLOW.md) | Database migrations, blast radius analysis, branching strategy, deployment |

---

## License

Proprietary — All rights reserved.