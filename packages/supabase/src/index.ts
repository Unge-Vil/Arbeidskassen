export { createBrowserClient } from "./client";
export { createServerClient } from "./server";
export {
  getCurrentUser,
  getEffectiveRole,
  getSelectedTenantId,
  getTenantContext,
  requireTenantContext,
  signOut,
  switchTenant,
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
  getCurrentTenantDirectory,
  getCurrentTenantStructure,
  summarizeTenantActivity,
  summarizeTenantDirectory,
  summarizeTenantStructure,
  type TenantActivityItem,
  type TenantDirectoryMember,
  type TenantStructureSummary,
} from "./organization";
export type { Database } from "./types";
