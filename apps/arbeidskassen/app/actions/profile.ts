"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  sanitizeUserProfileInput,
  updateCurrentUserProfile,
  updateCurrentUserThemePreference,
} from "@arbeidskassen/supabase";

function normalizeLocale(value: FormDataEntryValue | null): "no" | "en" {
  return value === "en" ? "en" : "no";
}

function getEncodedErrorMessage(message: string): string {
  return encodeURIComponent(message);
}

export async function updateThemePreferenceAction(formData: FormData) {
  const currentLocale = normalizeLocale(formData.get("locale"));
  const result = await updateCurrentUserThemePreference(formData.get("themePreference"));

  if (!result.success) {
    console.error("Failed to update theme preference", result.error);
  }

  revalidatePath(`/${currentLocale}`, "layout");
  revalidatePath("/", "layout");

  return result;
}

export async function updateProfileAction(formData: FormData) {
  const currentLocale = normalizeLocale(formData.get("locale"));

  const profileInput = sanitizeUserProfileInput({
    displayName: formData.get("displayName"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
    preferredLocale: formData.get("preferredLocale"),
    themePreference: formData.get("themePreference"),
    notifyEmail: formData.get("notifyEmail"),
    notifyInApp: formData.get("notifyInApp"),
    notifyWeeklySummary: formData.get("notifyWeeklySummary"),
  });

  if (profileInput.displayName.length > 80 || profileInput.jobTitle.length > 80) {
    redirect(
      `/${currentLocale}/profil?error=${getEncodedErrorMessage("Navn eller stilling er for lang.")}`,
    );
  }

  const result = await updateCurrentUserProfile(profileInput);

  if (!result.success) {
    redirect(
      `/${currentLocale}/profil?error=${getEncodedErrorMessage(
        result.error ?? "Kunne ikke lagre profilen akkurat nå.",
      )}`,
    );
  }

  const targetLocale = profileInput.preferredLocale;

  revalidatePath(`/${currentLocale}/profil`);
  revalidatePath(`/${targetLocale}/profil`);
  revalidatePath(`/${currentLocale}/dashboard`);
  revalidatePath(`/${targetLocale}/dashboard`);
  revalidatePath("/", "layout");

  redirect(`/${targetLocale}/profil?saved=1`);
}
