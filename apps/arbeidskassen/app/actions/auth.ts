"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildArbeidskassenHref,
  extractLocaleFromPathname,
  normalizeReturnTo,
} from "@arbeidskassen/ui";
import { signOut, switchTenant } from "@arbeidskassen/supabase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getActionLocale(formData: FormData) {
  const rawLocale = formData.get("locale");

  return extractLocaleFromPathname(
    typeof rawLocale === "string" ? rawLocale.trim() : undefined,
  );
}

export async function switchTenantAction(formData: FormData) {
  const locale = getActionLocale(formData);
  const dashboardPath = buildArbeidskassenHref(locale, "/dashboard");
  const selectTenantPath = buildArbeidskassenHref(locale, "/select-tenant");
  const safeReturnTo = normalizeReturnTo(
    typeof formData.get("returnTo") === "string" ? String(formData.get("returnTo")) : null,
    locale,
  );
  const rawTenantId = formData.get("tenantId");
  const tenantId = typeof rawTenantId === "string" ? rawTenantId.trim() : "";

  if (!UUID_PATTERN.test(tenantId)) {
    redirect(`${selectTenantPath}?error=Ugyldig%20workspacevalg.`);
  }

  const result = await switchTenant(tenantId);

  if (!result.success) {
    const errorMessage = encodeURIComponent(
      result.error ?? "Kunne ikke bytte workspace.",
    );
    redirect(`${selectTenantPath}?error=${errorMessage}`);
  }

  revalidatePath("/", "layout");
  revalidatePath(buildArbeidskassenHref(locale, "/"), "layout");
  revalidatePath(dashboardPath, "layout");
  redirect(safeReturnTo ?? dashboardPath);
}

export async function signOutAction(formData: FormData) {
  const locale = getActionLocale(formData);
  const landingPath = buildArbeidskassenHref(locale, "/");
  const dashboardPath = buildArbeidskassenHref(locale, "/dashboard");
  const result = await signOut();

  if (!result.success) {
    const errorMessage = encodeURIComponent(
      result.error ?? "Kunne ikke logge ut akkurat nå.",
    );
    redirect(`${dashboardPath}?error=${errorMessage}`);
  }

  revalidatePath("/", "layout");
  revalidatePath(landingPath, "layout");
  revalidatePath(dashboardPath, "layout");
  redirect(landingPath);
}
