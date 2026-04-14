"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canManageTenantAdministration,
  createServerClient,
  getEffectiveRole,
  getTenantContext,
  type TenantContext,
  type TenantRole,
} from "@arbeidskassen/supabase";
import {
  type SupportedLocale,
  getEncodedErrorMessage,
  getOptionalString,
  normalizeAppLocale,
} from "./shared";

type MemberAdminContext = TenantContext & {
  user: NonNullable<TenantContext["user"]>;
  currentTenant: NonNullable<TenantContext["currentTenant"]>;
  currentMembership: NonNullable<TenantContext["currentMembership"]>;
};

type ResolvedScope = {
  orgId: string | null;
  deptId: string | null;
  subDepartmentId: string | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeRole(value: FormDataEntryValue | null): TenantRole {
  if (value === "owner" || value === "admin" || value === "member") {
    return value;
  }

  return "viewer";
}

function getMembersRedirectBase(_locale: SupportedLocale): string {
  return `/organisasjon/brukere`;
}

function redirectWithError(locale: SupportedLocale, message: string): never {
  redirect(`${getMembersRedirectBase(locale)}?error=${getEncodedErrorMessage(message)}`);
}

function redirectWithSuccess(locale: SupportedLocale, message: string): never {
  redirect(`${getMembersRedirectBase(locale)}?saved=1&message=${getEncodedErrorMessage(message)}`);
}

function revalidateMemberPaths(_locale: SupportedLocale): void {
  revalidatePath(`/organisasjon/brukere`);
  revalidatePath(`/organisasjon/audit-logg`);
}

async function requireMemberAdmin(locale: SupportedLocale): Promise<MemberAdminContext> {
  const context = await getTenantContext();

  if (!context?.user || !context.currentTenant || !context.currentMembership) {
    redirectWithError(locale, "Fant ingen aktiv organisasjon å oppdatere.");
  }

  if (!canManageTenantAdministration(context)) {
    redirectWithError(locale, "Du har ikke tilgang til å administrere medlemmer.");
  }

  return context as MemberAdminContext;
}

async function resolveScope(
  context: MemberAdminContext,
  scope: {
    orgId: string | null;
    deptId: string | null;
    subDepartmentId: string | null;
  },
): Promise<ResolvedScope | { error: string }> {
  const supabase = await createServerClient();

  let orgId = scope.orgId;
  let deptId = scope.deptId;
  const subDepartmentId = scope.subDepartmentId;

  if (subDepartmentId) {
    const { data: subDepartmentRecord, error } = await supabase
      .from("sub_departments")
      .select("id, dept_id, is_archived")
      .eq("tenant_id", context.currentTenant.id)
      .eq("id", subDepartmentId)
      .maybeSingle();

    const subDepartment = subDepartmentRecord as {
      id: string;
      dept_id: string;
      is_archived: boolean;
    } | null;

    if (error || !subDepartment || subDepartment.is_archived) {
      return { error: "Velg en aktiv underavdeling." };
    }

    if (deptId && deptId !== subDepartment.dept_id) {
      return { error: "Underavdelingen må høre til valgt avdeling." };
    }

    deptId = subDepartment.dept_id;
  }

  if (deptId) {
    const { data: departmentRecord, error } = await supabase
      .from("departments")
      .select("id, org_id, is_archived")
      .eq("tenant_id", context.currentTenant.id)
      .eq("id", deptId)
      .maybeSingle();

    const department = departmentRecord as {
      id: string;
      org_id: string;
      is_archived: boolean;
    } | null;

    if (error || !department || department.is_archived) {
      return { error: "Velg en aktiv avdeling." };
    }

    if (orgId && orgId !== department.org_id) {
      return { error: "Avdelingen må høre til valgt virksomhet." };
    }

    orgId = department.org_id;
  }

  if (orgId) {
    const { data: organizationRecord, error } = await supabase
      .from("organizations")
      .select("id, is_archived")
      .eq("tenant_id", context.currentTenant.id)
      .eq("id", orgId)
      .maybeSingle();

    const organization = organizationRecord as { id: string; is_archived: boolean } | null;

    if (error || !organization || organization.is_archived) {
      return { error: "Velg en aktiv virksomhet." };
    }
  }

  return {
    orgId,
    deptId,
    subDepartmentId,
  };
}

async function getActiveOwnerCount(tenantId: string): Promise<number> {
  const supabase = await createServerClient();
  const { count } = await supabase
    .from("tenant_members")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "owner")
    .eq("is_active", true);

  return count ?? 0;
}

function getRoleChangeError(options: {
  actorRole: TenantRole;
  targetRole: TenantRole;
  nextRole: TenantRole;
  isDeactivation: boolean;
  isCurrentUser: boolean;
  activeOwnerCount: number;
}): string | null {
  const { actorRole, targetRole, nextRole, isDeactivation, isCurrentUser, activeOwnerCount } =
    options;

  if (actorRole !== "owner" && (targetRole === "owner" || nextRole === "owner")) {
    return "Bare eier kan endre eller tildele eierrollen.";
  }

  if (isCurrentUser && isDeactivation) {
    return "Du kan ikke deaktivere ditt eget medlemskap.";
  }

  if (targetRole === "owner" && (isDeactivation || nextRole !== "owner") && activeOwnerCount <= 1) {
    return "Tenanten må alltid ha minst én aktiv eier.";
  }

  return null;
}

export async function inviteTenantMemberAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireMemberAdmin(locale);
  const actorRole = getEffectiveRole(context);

  const userId = getOptionalString(formData.get("userId"));
  const role = normalizeRole(formData.get("role"));
  const orgId = getOptionalString(formData.get("orgId"));
  const deptId = getOptionalString(formData.get("deptId"));
  const subDepartmentId = getOptionalString(formData.get("subDepartmentId"));

  if (!userId || !uuidPattern.test(userId)) {
    redirectWithError(locale, "Bruker-ID må være en gyldig UUID for en registrert konto.");
  }

  if (actorRole !== "owner" && role === "owner") {
    redirectWithError(locale, "Bare eier kan invitere andre som eiere.");
  }

  const resolvedScope = await resolveScope(context, { orgId, deptId, subDepartmentId });

  if ("error" in resolvedScope) {
    redirectWithError(locale, resolvedScope.error);
  }

  const supabase = await createServerClient();
  const { data: existingMember } = await supabase
    .from("tenant_members")
    .select("id")
    .eq("tenant_id", context.currentTenant.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    redirectWithError(locale, "Denne brukeren finnes allerede i denne workspacen.");
  }

  const { error } = await supabase.from("tenant_members").insert(
    {
      tenant_id: context.currentTenant.id,
      user_id: userId,
      role,
      is_active: true,
      org_id: resolvedScope.orgId,
      dept_id: resolvedScope.deptId,
      sub_department_id: resolvedScope.subDepartmentId,
      module_roles: {},
    } as never,
  );

  if (error) {
    console.error("Failed to invite member", error);

    if (error.code === "23503") {
      redirectWithError(locale, "Brukeren må ha opprettet konto før den kan inviteres inn.");
    }

    if (error.code === "23505") {
      redirectWithError(locale, "Denne brukeren finnes allerede i denne workspacen.");
    }

    redirectWithError(locale, "Kunne ikke legge til brukeren akkurat nå.");
  }

  revalidateMemberPaths(locale);
  redirectWithSuccess(locale, "Brukeren ble lagt til i workspacen.");
}

export async function updateTenantMemberAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireMemberAdmin(locale);
  const actorRole = getEffectiveRole(context);

  const memberId = getOptionalString(formData.get("memberId"));
  const role = normalizeRole(formData.get("role"));
  const orgId = getOptionalString(formData.get("orgId"));
  const deptId = getOptionalString(formData.get("deptId"));
  const subDepartmentId = getOptionalString(formData.get("subDepartmentId"));

  if (!memberId) {
    redirectWithError(locale, "Kunne ikke finne medlemskapet som skulle oppdateres.");
  }

  const supabase = await createServerClient();
  const { data: memberRecord, error: memberError } = await supabase
    .from("tenant_members")
    .select("id, user_id, role, is_active")
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", memberId)
    .maybeSingle();

  const member = memberRecord as {
    id: string;
    user_id: string;
    role: TenantRole;
    is_active: boolean;
  } | null;

  if (memberError || !member) {
    redirectWithError(locale, "Kunne ikke finne medlemskapet som skulle oppdateres.");
  }

  const activeOwnerCount = await getActiveOwnerCount(context.currentTenant.id);
  const roleChangeError = getRoleChangeError({
    actorRole,
    targetRole: member.role,
    nextRole: role,
    isDeactivation: false,
    isCurrentUser: member.user_id === context.user.id,
    activeOwnerCount,
  });

  if (roleChangeError) {
    redirectWithError(locale, roleChangeError);
  }

  const resolvedScope = await resolveScope(context, { orgId, deptId, subDepartmentId });

  if ("error" in resolvedScope) {
    redirectWithError(locale, resolvedScope.error);
  }

  const { error } = await supabase
    .from("tenant_members")
    .update(
      {
        role,
        org_id: resolvedScope.orgId,
        dept_id: resolvedScope.deptId,
        sub_department_id: resolvedScope.subDepartmentId,
      } as never,
    )
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", memberId);

  if (error) {
    console.error("Failed to update tenant member", error);
    redirectWithError(locale, "Kunne ikke oppdatere medlemmet akkurat nå.");
  }

  revalidateMemberPaths(locale);
  redirectWithSuccess(locale, "Medlemskapet ble oppdatert.");
}

export async function toggleTenantMemberActiveAction(formData: FormData) {
  const locale = normalizeAppLocale(formData.get("currentLocale"));
  const context = await requireMemberAdmin(locale);
  const actorRole = getEffectiveRole(context);

  const memberId = getOptionalString(formData.get("memberId"));
  const nextIsActive = formData.get("nextIsActive") === "true";

  if (!memberId) {
    redirectWithError(locale, "Kunne ikke finne medlemskapet som skulle oppdateres.");
  }

  const supabase = await createServerClient();
  const { data: memberRecord, error: memberError } = await supabase
    .from("tenant_members")
    .select("id, user_id, role, is_active")
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", memberId)
    .maybeSingle();

  const member = memberRecord as {
    id: string;
    user_id: string;
    role: TenantRole;
    is_active: boolean;
  } | null;

  if (memberError || !member) {
    redirectWithError(locale, "Kunne ikke finne medlemskapet som skulle oppdateres.");
  }

  const activeOwnerCount = await getActiveOwnerCount(context.currentTenant.id);
  const roleChangeError = getRoleChangeError({
    actorRole,
    targetRole: member.role,
    nextRole: member.role,
    isDeactivation: !nextIsActive,
    isCurrentUser: member.user_id === context.user.id,
    activeOwnerCount,
  });

  if (roleChangeError) {
    redirectWithError(locale, roleChangeError);
  }

  const { error } = await supabase
    .from("tenant_members")
    .update({ is_active: nextIsActive } as never)
    .eq("tenant_id", context.currentTenant.id)
    .eq("id", memberId);

  if (error) {
    console.error("Failed to toggle tenant member active state", error);
    redirectWithError(locale, "Kunne ikke oppdatere medlemmet akkurat nå.");
  }

  revalidateMemberPaths(locale);
  redirectWithSuccess(
    locale,
    nextIsActive ? "Medlemmet ble aktivert igjen." : "Medlemmet ble deaktivert.",
  );
}
