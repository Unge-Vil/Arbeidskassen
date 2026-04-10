"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut, switchTenant } from "@arbeidskassen/supabase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function switchTenantAction(formData: FormData) {
  const rawTenantId = formData.get("tenantId");
  const tenantId = typeof rawTenantId === "string" ? rawTenantId.trim() : "";

  if (!UUID_PATTERN.test(tenantId)) {
    redirect("/select-tenant?error=Ugyldig%20workspacevalg.");
  }

  const result = await switchTenant(tenantId);

  if (!result.success) {
    const errorMessage = encodeURIComponent(
      result.error ?? "Kunne ikke bytte workspace.",
    );
    redirect(`/select-tenant?error=${errorMessage}`);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const result = await signOut();

  if (!result.success) {
    const errorMessage = encodeURIComponent(
      result.error ?? "Kunne ikke logge ut akkurat nå.",
    );
    redirect(`/dashboard?error=${errorMessage}`);
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard", "layout");
  redirect("/");
}
