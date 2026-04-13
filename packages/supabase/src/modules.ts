import type { TenantSummary } from "./auth";

export type AppModule =
  | "dashboard"
  | "today"
  | "teamarea"
  | "bookdet"
  | "organisasjon"
  | "backoffice"
  | "sales-portal";

export type TenantPlan = "free" | "starter" | "professional" | "enterprise";

// Modules available on each plan tier (cumulative).
// backoffice and sales-portal are internal modules — only enterprise tenants get them.
const PLAN_MODULES: Record<TenantPlan, AppModule[]> = {
  free: ["dashboard", "today", "teamarea"],
  starter: ["dashboard", "today", "teamarea", "bookdet"],
  professional: ["dashboard", "today", "teamarea", "bookdet", "organisasjon"],
  enterprise: [
    "dashboard",
    "today",
    "teamarea",
    "bookdet",
    "organisasjon",
    "backoffice",
    "sales-portal",
  ],
};

/**
 * Returns the list of modules enabled for a given tenant.
 * Defaults to the `free` tier if the plan is unrecognised.
 */
export function getEnabledModules(tenant: Pick<TenantSummary, "plan">): AppModule[] {
  return PLAN_MODULES[tenant.plan as TenantPlan] ?? PLAN_MODULES.free;
}

/**
 * Returns true if a specific module is enabled for the given tenant.
 */
export function isModuleEnabled(
  module: AppModule,
  tenant: Pick<TenantSummary, "plan">,
): boolean {
  return getEnabledModules(tenant).includes(module);
}
