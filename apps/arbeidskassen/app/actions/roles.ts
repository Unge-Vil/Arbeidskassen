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
import {
  type SupportedLocale,
  getEncodedErrorMessage,
  getOptionalString,
  normalizeAppLocale,
  normalizeSlug,
  validateLength,
} from "./shared";

type RoleAdminContext = TenantContext & {
  currentTenant: NonNullable<TenantContext["currentTenant"]>;
  currentMembership: NonNullable<TenantContext["currentMembership"]>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getRolesRedirectBase(_locale: SupportedLocale): string {
  return `/organisasjon/roller`;
}

function redirectWithError(locale: SupportedLocale, message: string): never {
  redirect(`${getRolesRedirectBase(locale)}?error=${getEncodedErrorMessage(message)}`);
}

function redirectWithSuccess(locale: SupportedLocale, message: string): never {
  redirect(`${getRolesRedirectBase(locale)}?saved=1&message=${getEncodedErrorMessage(message)}`);
}

function revalidateRolePaths(_locale: SupportedLocale): void {
  revalidatePath(`/organisasjon/roller`);
  revalidatePath(`/organisasjon/brukere`);
  revalidatePath(`/organisasjon/audit-logg`);
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

  const slug = explicitSlug ?? normalizeSlug(name) ?? `role-${crypto.randomUUID().slice(0, 8)}`;
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

  if (!uuidPattern.test(roleId)) {
    redirectWithError(locale, "Rolle-ID må være en gyldig UUID.");
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

  if (!uuidPattern.test(roleId)) {
    redirectWithError(locale, "Rolle-ID må være en gyldig UUID.");
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

  if (!uuidPattern.test(memberId) || !uuidPattern.test(roleId)) {
    redirectWithError(locale, "Medlem- og rolle-ID må være gyldige UUID-er.");
  }

  const supabase = await createServerClient();
  const [{ data: memberRecord, error: memberError }, { data: roleRecord, error: roleError }] =
    await Promise.all([
      supabase
        .from("tenant_members")
        .select("id")
        .eq("tenant_id", context.currentTenant.id)
        .eq("id", memberId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("custom_roles")
        .select("id")
        .eq("tenant_id", context.currentTenant.id)
        .eq("id", roleId)
        .eq("is_archived", false)
        .maybeSingle(),
    ]);

  if (memberError || !memberRecord) {
    redirectWithError(locale, "Kunne ikke finne et aktivt medlem i denne workspacen.");
  }

  if (roleError || !roleRecord) {
    redirectWithError(locale, "Kunne ikke finne en aktiv custom rolle i denne workspacen.");
  }

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

  if (!uuidPattern.test(assignmentId)) {
    redirectWithError(locale, "Tildelings-ID må være en gyldig UUID.");
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
