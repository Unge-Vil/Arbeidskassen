"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildLocalizedAppHref, extractLocaleFromPathname } from "@arbeidskassen/ui";
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
  const localizedRoot = buildLocalizedAppHref("", locale);
  const rawTenantId = formData.get("tenantId");
  const tenantId = typeof rawTenantId === "string" ? rawTenantId.trim() : "";

  if (!UUID_PATTERN.test(tenantId)) {
    redirect(`${localizedRoot}?error=Ugyldig%20workspacevalg.`);
  }

  const result = await switchTenant(tenantId);

  if (!result.success) {
    const errorMessage = encodeURIComponent(result.error ?? "Kunne ikke bytte workspace.");
    redirect(`${localizedRoot}?error=${errorMessage}`);
  }

  revalidatePath("/", "layout");
  revalidatePath(localizedRoot, "layout");
  redirect(localizedRoot);
}

export async function signOutAction(formData: FormData) {
  const locale = getActionLocale(formData);
  const localizedRoot = buildLocalizedAppHref("", locale);
  const result = await signOut();

  if (!result.success) {
    const errorMessage = encodeURIComponent(result.error ?? "Kunne ikke logge ut akkurat nå.");
    redirect(`${localizedRoot}?error=${errorMessage}`);
  }

  revalidatePath("/", "layout");
  revalidatePath(localizedRoot, "layout");
  redirect(localizedRoot);
}
