"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canManageTenantAdministration,
  createServerClient,
  getTenantContext,
  normalizePermissionKeys,
  PLATFORM_PERMISSION_KEYS,
  type PlatformPermissionKey,
  type TenantContext,
} from "@arbeidskassen/supabase";

type SupportedLocale = "no" | "en";
type RoleAdminContext = TenantContext & {
  currentTenant: NonNullable<TenantContext["currentTenant"]>;
  currentMembership: NonNullable<TenantContext["currentMembership"]>;
};

function getEncodedErrorMessage(message: string): string {
  return encodeURIComponent(message);
}

function normalizeAppLocale(value: FormDataEntryValue | null): SupportedLocale {
  return value === "en" ? "en" : "no";
}

function getOptionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateLength(value: string | null, maxLength: number): boolean {
  return !value || value.length <= maxLength;
}

function normalizeSlug(value: FormDataEntryValue | null): string | null {
  const rawValue = getOptionalString(value);

  if (!rawValue) {
    return null;
  }

  return rawValue
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function getRolesRedirectBase(locale: SupportedLocale): string {
  return `/${locale}/roller`;
}

function redirectWithError(locale: SupportedLocale, message: string): never {
  redirect(`${getRolesRedirectBase(locale)}?error=${getEncodedErrorMessage(message)}`);
}

function redirectWithSuccess(locale: SupportedLocale, message: string): never {
  redirect(`${getRolesRedirectBase(locale)}?saved=1&message=${getEncodedErrorMessage(message)}`);
}

function revalidateRolePaths(locale: SupportedLocale): void {
  revalidatePath(getRolesRedirectBase(locale));
  revalidatePath(`/${locale}/brukere`);
  revalidatePath(`/${locale}/audit-logg`);
}

async function requireRoleAdmin(locale: SupportedLocale): Promise<RoleAdminContext> {
  const context = await getTenantContext();

  if (!context?.user || !context.currentTenant || !context.currentMembership) {
    redirectWithError(locale, "Fant ingen aktiv organisasjon å oppdatere.");
  }

  if (!canManageTenantAdministration(context)) {
    redirectWithError(locale, "Du har ikke tilgang til å administrere roller og tilganger.");
  }

  return context as RoleAdminContext;
}

function getPermissionsFromFormData(formData: FormData): PlatformPermissionKey[] {
  const rawPermissions = formData
    .getAll("permissions")
    .filter((value): value is string => typeof value === "string");

  return normalizePermissionKeys(rawPermissions.filter((permission) => PLATFORM_PERMISSION_KEYS.includes(permission as PlatformPermissionKey)));
}

export async function createCustomRoleAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireRoleAdmin(locale);

  const name = getOptionalString(formData.get("name"));
  const description = getOptionalString(formData.get("description"));
  const explicitSlug = normalizeSlug(formData.get("slug"));
  const permissions = getPermissionsFromFormData(formData);

  if (!name) {
    redirectWithError(locale, "Custom rollen må ha et navn.");
  }

  if (!validateLength(name, 80) || !validateLength(description, 240)) {
    redirectWithError(locale, "Navnet eller beskrivelsen er for lang.");
  }

  const slug = explicitSlug ?? normalizeSlug(name) ?? `role-${Date.now()}`;
  const supabase = await createServerClient();
  const { error } = await supabase.from("custom_roles").insert(
    {
      tenant_id: context.currentTenant.id,
      slug,
      name,
      description,
      permissions,
      created_by: context.user.id,
    } as never,
  );

  if (error) {
    console.error("Failed to create custom role", error);

    if (error.code === "23505") {
      redirectWithError(locale, "Kortnavnet for rollen er allerede i bruk.");
    }

    redirectWithError(locale, "Kunne ikke opprette rollen akkurat nå.");
  }

  revalidateRolePaths(locale);
  redirectWithSuccess(locale, `Custom rollen “${name}” ble opprettet.`);
}

export async function updateCustomRoleAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireRoleAdmin(locale);

  const roleId = getOptionalString(formData.get("roleId"));
  const name = getOptionalString(formData.get("name"));
  const description = getOptionalString(formData.get("description"));
  const explicitSlug = normalizeSlug(formData.get("slug"));
  const permissions = getPermissionsFromFormData(formData);

  if (!roleId || !name) {
    redirectWithError(locale, "Rollen må ha et navn for å kunne lagres.");
  }

  if (!validateLength(name, 80) || !validateLength(description, 240)) {
    redirectWithError(locale, "Navnet eller beskrivelsen er for lang.");
  }

  const slug = explicitSlug ?? normalizeSlug(name);
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("custom_roles")
    .update(
      {
        name,
        slug,
        description,
        permissions,
      } as never,
    )
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", roleId);

  if (error) {
    console.error("Failed to update custom role", error);

    if (error.code === "23505") {
      redirectWithError(locale, "Kortnavnet for rollen er allerede i bruk.");
    }

    redirectWithError(locale, "Kunne ikke oppdatere rollen akkurat nå.");
  }

  revalidateRolePaths(locale);
  redirectWithSuccess(locale, `Custom rollen “${name}” ble oppdatert.`);
}

export async function toggleCustomRoleArchiveAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireRoleAdmin(locale);

  const roleId = getOptionalString(formData.get("roleId"));
  const nextArchived = formData.get("nextArchived") === "true";

  if (!roleId) {
    redirectWithError(locale, "Kunne ikke finne rollen som skulle oppdateres.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("custom_roles")
    .update({ is_archived: nextArchived } as never)
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", roleId);

  if (error) {
    console.error("Failed to update custom role archive state", error);
    redirectWithError(locale, "Kunne ikke oppdatere rollen akkurat nå.");
  }

  revalidateRolePaths(locale);
  redirectWithSuccess(
    locale,
    nextArchived ? "Rollen ble arkivert." : "Rollen ble aktivert igjen.",
  );
}

export async function assignCustomRoleAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireRoleAdmin(locale);

  const memberId = getOptionalString(formData.get("memberId"));
  const roleId = getOptionalString(formData.get("roleId"));

  if (!memberId || !roleId) {
    redirectWithError(locale, "Velg både medlem og rolle før du lagrer.");
  }

  const supabase = await createServerClient();
  const { data: existingAssignmentRecord } = await supabase
    .from("member_role_assignments")
    .select("id")
    .eq("tenant_id", context.currentTenant.id)
    .eq("member_id", memberId)
    .eq("role_id", roleId)
    .maybeSingle();

  const existingAssignment = existingAssignmentRecord as { id: string } | null;

  if (existingAssignment) {
    const { error } = await supabase
      .from("member_role_assignments")
      .update({ is_active: true } as never)
      .eq("tenant_id", context.currentTenant.id)
      .eq("id", existingAssignment.id);

    if (error) {
      console.error("Failed to reactivate custom role assignment", error);
      redirectWithError(locale, "Kunne ikke tildele rollen akkurat nå.");
    }
  } else {
    const { error } = await supabase.from("member_role_assignments").insert(
      {
        tenant_id: context.currentTenant.id,
        member_id: memberId,
        role_id: roleId,
        is_active: true,
        created_by: context.user.id,
      } as never,
    );

    if (error) {
      console.error("Failed to assign custom role", error);
      redirectWithError(locale, "Kunne ikke tildele rollen akkurat nå.");
    }
  }

  revalidateRolePaths(locale);
  redirectWithSuccess(locale, "Custom rollen ble tildelt medlemmet.");
}

export async function revokeCustomRoleAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireRoleAdmin(locale);

  const assignmentId = getOptionalString(formData.get("assignmentId"));

  if (!assignmentId) {
    redirectWithError(locale, "Kunne ikke finne rolletildelingen som skulle fjernes.");
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("member_role_assignments")
    .update({ is_active: false } as never)
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", assignmentId);

  if (error) {
    console.error("Failed to revoke custom role", error);
    redirectWithError(locale, "Kunne ikke fjerne rolletildelingen akkurat nå.");
  }

  revalidateRolePaths(locale);
  redirectWithSuccess(locale, "Rolletildelingen ble fjernet.");
}
