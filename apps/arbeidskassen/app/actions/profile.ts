"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  sanitizeUserProfileInput,
  updateCurrentUserProfile,
  updateCurrentUserThemePreference,
} from "@arbeidskassen/supabase";
import { getEncodedErrorMessage } from "./shared";

export async function updateThemePreferenceAction(formData: FormData) {
  const result = await updateCurrentUserThemePreference(formData.get("themePreference"));

  if (!result.success) {
    console.error("Failed to update theme preference", result.error);
  }
}

export async function updateProfileAction(formData: FormData) {
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
      `/profil?error=${getEncodedErrorMessage("Navn eller stilling er for lang.")}`,
    );
  }

  const result = await updateCurrentUserProfile(profileInput);

  if (!result.success) {
    redirect(
      `/profil?error=${getEncodedErrorMessage(
        result.error ?? "Kunne ikke lagre profilen akkurat nå.",
      )}`,
    );
  }

  revalidatePath("/profil");

  redirect(`/profil?saved=1`);
}
