export { createAdminClient } from "./admin";
export {
  addCredits,
  consumeCredits,
  getCreditBalance,
  type AddCreditsInput,
  type ConsumeCreditsInput,
  type CreditBalance,
  type CreditOperationResult,
} from "./ai-credits";
export { createBrowserClient } from "./client";
export { createServerClient } from "./server";
export {
  canManageTenantAdministration,
  getCurrentUser,
  getEffectivePermissions,
  getEffectiveRole,
  getSelectedTenantId,
  getShellContext,
  getTenantContext,
  hasAnyTenantRole,
  hasPermission,
  requireTenantContext,
  signOut,
  switchTenant,
  type ShellContext,
  type TenantContext,
  type TenantMembership,
  type TenantRole,
  type TenantSummary,
} from "./auth";
export {
  getCurrentUserProfile,
  normalizeProfileMetadata,
  sanitizeUserProfileInput,
  updateCurrentUserProfile,
  updateCurrentUserThemePreference,
  type CurrentUserProfile,
  type NotificationPreferences,
  type ProfileLocale,
  type ProfileThemePreference,
  type UserProfile,
} from "./profile";
export {
  getCurrentUserDashboardsSafe,
  type DashboardItem,
  type UserDashboard,
} from "./dashboard";
export {
  getCurrentTenantActivity,
  getCurrentTenantCustomRoles,
  getCurrentTenantDirectory,
  getCurrentTenantStructure,
  summarizeTenantActivity,
  summarizeTenantDirectory,
  summarizeTenantStructure,
  type TenantActivityItem,
  type TenantCustomRoleSummary,
  type TenantDirectoryMember,
  type TenantStructureSummary,
} from "./organization";
export {
  createPermissionMap,
  DEFAULT_ROLE_PERMISSIONS,
  getPermissionDefinitionsByGroup,
  normalizePermissionKeys,
  PLATFORM_PERMISSION_DEFINITIONS,
  PLATFORM_PERMISSION_KEYS,
  type PermissionMap,
  type PlatformPermissionDefinition,
  type PlatformPermissionKey,
} from "./permissions";
export {
  getEnabledModules,
  isModuleEnabled,
  type AppModule,
  type TenantPlan,
} from "./modules";
export type { Database } from "./types";
