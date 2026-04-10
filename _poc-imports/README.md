# POC Imports

> **This folder is a staging area for raw, external prototype code.** It is NOT part of the production codebase.

## Purpose

Drop raw code here — React mockups, standalone widgets, HTML prototypes, or any output from external AI tools (v0, Bolt, Lovable, Claude Artifacts, etc.). The code in this folder is **read-only inspiration** that must be rewritten before entering any production app.

## Rules

1. **Never import from this folder.** No `apps/` or `packages/` code may reference `_poc-imports/`.
2. **Never deploy this code.** This folder is excluded from Turborepo pipelines and build outputs.
3. **Organize by feature.** Create a subfolder per prototype (e.g., `_poc-imports/shift-planner/`, `_poc-imports/booking-widget/`).
4. **Include context.** Add a brief `NOTES.md` in each subfolder explaining what the prototype does and which app/route it targets.
5. **Delete after integration.** Once the code has been rewritten and merged into production, remove the subfolder.

## Workflow

See [docs/POC_INGESTION_WORKFLOW.md](docs/POC_INGESTION_WORKFLOW.md) for the full ingestion process.
