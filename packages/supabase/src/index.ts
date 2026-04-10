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
export type { Database } from "./types";
