import type { User } from "@supabase/supabase-js";

import { createServerClient } from "./server";

export type ProfileLocale = "no" | "en";
export type ProfileThemePreference = "light" | "dark" | "night" | "system";

export type NotificationPreferences = {
  email: boolean;
  inApp: boolean;
  weeklySummary: boolean;
};

export type UserProfile = {
  displayName: string;
  phone: string;
  jobTitle: string;
  preferredLocale: ProfileLocale;
  themePreference: ProfileThemePreference;
  notificationPreferences: NotificationPreferences;
};

export type CurrentUserProfile = {
  user: User;
  profile: UserProfile;
};

const defaultNotificationPreferences: NotificationPreferences = {
  email: true,
  inApp: true,
  weeklySummary: false,
};

const defaultUserProfile: UserProfile = {
  displayName: "",
  phone: "",
  jobTitle: "",
  preferredLocale: "no",
  themePreference: "system",
  notificationPreferences: defaultNotificationPreferences,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizePhone(value: unknown): string {
  const sanitized = normalizeText(value, 32).replace(/[^0-9+()\-\s]/g, "");
  return sanitized.slice(0, 32);
}

function normalizeLocale(value: unknown): ProfileLocale {
  return value === "en" ? "en" : "no";
}

function normalizeThemePreference(value: unknown): ProfileThemePreference {
  if (
    value === "light" ||
    value === "dark" ||
    value === "night" ||
    value === "system"
  ) {
    return value;
  }

  return "system";
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["true", "1", "on", "yes"].includes(normalizedValue)) {
      return true;
    }

    if (["false", "0", "off", "no"].includes(normalizedValue)) {
      return false;
    }
  }

  return fallback;
}

export function normalizeProfileMetadata(userMetadata: unknown): UserProfile {
  if (!isRecord(userMetadata)) {
    return { ...defaultUserProfile };
  }

  const notificationPreferences = isRecord(userMetadata.notification_preferences)
    ? userMetadata.notification_preferences
    : {};

  return {
    displayName: normalizeText(
      userMetadata.display_name ?? userMetadata.full_name,
      80,
    ),
    phone: normalizePhone(userMetadata.phone),
    jobTitle: normalizeText(userMetadata.job_title, 80),
    preferredLocale: normalizeLocale(userMetadata.preferred_locale),
    themePreference: normalizeThemePreference(userMetadata.theme_preference),
    notificationPreferences: {
      email: normalizeBoolean(
        notificationPreferences.email,
        defaultNotificationPreferences.email,
      ),
      inApp: normalizeBoolean(
        notificationPreferences.inApp ?? notificationPreferences.in_app,
        defaultNotificationPreferences.inApp,
      ),
      weeklySummary: normalizeBoolean(
        notificationPreferences.weeklySummary ??
          notificationPreferences.weekly_summary,
        defaultNotificationPreferences.weeklySummary,
      ),
    },
  };
}

export function sanitizeUserProfileInput(
  input: Record<string, unknown>,
): UserProfile {
  return {
    displayName: normalizeText(input.displayName, 80),
    phone: normalizePhone(input.phone),
    jobTitle: normalizeText(input.jobTitle, 80),
    preferredLocale: normalizeLocale(input.preferredLocale),
    themePreference: normalizeThemePreference(input.themePreference),
    notificationPreferences: {
      email: normalizeBoolean(input.notifyEmail, false),
      inApp: normalizeBoolean(input.notifyInApp, false),
      weeklySummary: normalizeBoolean(input.notifyWeeklySummary, false),
    },
  };
}

export async function getCurrentUserProfile(): Promise<CurrentUserProfile | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to resolve the current profile", error);
    return null;
  }

  if (!user) {
    return null;
  }

  return {
    user,
    profile: normalizeProfileMetadata(user.user_metadata),
  };
}

export async function updateCurrentUserThemePreference(
  themePreference: unknown,
): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  const currentProfile = await getCurrentUserProfile();

  if (!currentProfile) {
    return {
      success: false,
      error: "Du må være logget inn for å oppdatere temaet.",
    };
  }

  return updateCurrentUserProfile({
    ...currentProfile.profile,
    themePreference: normalizeThemePreference(themePreference),
  });
}

export async function updateCurrentUserProfile(
  input: UserProfile,
): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (userError) {
      console.error("Failed to authenticate before profile update", userError);
    }

    return {
      success: false,
      error: "Du må være logget inn for å oppdatere profilen.",
    };
  }

  const existingMetadata = isRecord(user.user_metadata) ? user.user_metadata : {};

  const { data, error: updateError } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      display_name: input.displayName,
      full_name: input.displayName,
      phone: input.phone,
      job_title: input.jobTitle,
      preferred_locale: input.preferredLocale,
      theme_preference: input.themePreference,
      notification_preferences: {
        email: input.notificationPreferences.email,
        inApp: input.notificationPreferences.inApp,
        weeklySummary: input.notificationPreferences.weeklySummary,
      },
    },
  });

  if (updateError) {
    console.error("Failed to update current profile", updateError);
    return {
      success: false,
      error: "Kunne ikke lagre profilen akkurat nå.",
    };
  }

  return {
    success: true,
    profile: normalizeProfileMetadata(data.user?.user_metadata ?? user.user_metadata),
  };
}
