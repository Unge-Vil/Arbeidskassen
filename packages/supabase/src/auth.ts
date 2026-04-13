import type { User } from "@supabase/supabase-js";
import {
  createPermissionMap,
  DEFAULT_ROLE_PERMISSIONS,
  normalizePermissionKeys,
  type PermissionMap,
  type PlatformPermissionKey,
} from "./permissions";
import { cache } from "react";
import { createServerClient } from "./server";
import type { Database } from "./types";

export type TenantRole = Database["public"]["Enums"]["tenant_role"];
export type TenantRecord = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantMembershipRecord = Database["public"]["Tables"]["tenant_members"]["Row"];

export type TenantSummary = Pick<
  TenantRecord,
  | "id"
  | "name"
  | "display_name"
  | "slug"
  | "logo_url"
  | "plan"
  | "plan_status"
  | "primary_color"
>;

export type TenantMembership = Pick<
  TenantMembershipRecord,
  | "id"
  | "tenant_id"
  | "role"
  | "is_active"
  | "org_id"
  | "dept_id"
  | "sub_department_id"
> & {
  moduleRoles: Record<string, unknown> | null;
  customPermissions: PlatformPermissionKey[];
  customRoleSlugs: string[];
  tenant: TenantSummary;
};

export type TenantContext = {
  user: User;
  memberships: TenantMembership[];
  currentTenant: TenantSummary | null;
  currentMembership: TenantMembership | null;
  selectedTenantId: string | null;
  hasExplicitTenantSelection: boolean;
  requiresTenantSelection: boolean;
};

type TenantQueryRow = Pick<
  TenantMembershipRecord,
  | "id"
  | "tenant_id"
  | "role"
  | "is_active"
  | "org_id"
  | "dept_id"
  | "sub_department_id"
> & {
  module_roles: unknown;
  tenants: TenantSummary | TenantSummary[] | null;
};

export function getSelectedTenantId(user: User): string | null {
  const appMetadata = user.app_metadata as Record<string, unknown> | undefined;
  const userMetadata = user.user_metadata as Record<string, unknown> | undefined;

  const appTenantId =
    typeof appMetadata?.current_tenant_id === "string"
      ? appMetadata.current_tenant_id
      : null;

  if (appTenantId) {
    return appTenantId;
  }

  return typeof userMetadata?.current_tenant_id === "string"
    ? userMetadata.current_tenant_id
    : null;
}

export function normalizeTenant(
  tenant: TenantSummary | TenantSummary[] | null,
): TenantSummary | null {
  if (!tenant) {
    return null;
  }

  return Array.isArray(tenant) ? (tenant[0] ?? null) : tenant;
}

export function normalizeModuleRoles(value: unknown): Record<string, unknown> | null {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to resolve the current user", error);
    return null;
  }

  return user;
}

export const getTenantContext = cache(async function getTenantContext(): Promise<TenantContext | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Failed to resolve the current user", userError);
    return null;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("tenant_members")
    .select(
      `
        id,
        tenant_id,
        role,
        is_active,
        org_id,
        dept_id,
        sub_department_id,
        module_roles,
        tenants (
          id,
          name,
          display_name,
          slug,
          logo_url,
          plan,
          plan_status,
          primary_color
        )
      `,
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load tenant memberships", error);
    return {
      user,
      memberships: [],
      currentTenant: null,
      currentMembership: null,
      selectedTenantId: getSelectedTenantId(user),
      hasExplicitTenantSelection: false,
      requiresTenantSelection: false,
    };
  }

  let memberships: TenantMembership[] = [];

  for (const membership of (data ?? []) as TenantQueryRow[]) {
    const tenant = normalizeTenant(membership.tenants);

    if (!tenant) {
      continue;
    }

    memberships.push({
      id: membership.id,
      tenant_id: membership.tenant_id,
      role: membership.role,
      is_active: membership.is_active,
      org_id: membership.org_id,
      dept_id: membership.dept_id,
      sub_department_id: membership.sub_department_id,
      moduleRoles: normalizeModuleRoles(membership.module_roles),
      customPermissions: [] as PlatformPermissionKey[],
      customRoleSlugs: [] as string[],
      tenant,
    });
  }

  if (memberships.length > 0) {
    const memberIds = memberships.map((membership) => membership.id);
    const tenantIds = [...new Set(memberships.map((membership) => membership.tenant_id))];

    const [assignmentResult, rolesResult] = await Promise.all([
      supabase
        .from("member_role_assignments")
        .select("member_id, role_id, is_active")
        .in("member_id", memberIds)
        .eq("is_active", true),
      supabase
        .from("custom_roles")
        .select("id, slug, permissions, is_archived, tenant_id")
        .in("tenant_id", tenantIds),
    ]);

    if (assignmentResult.error) {
      console.error("Failed to load custom role assignments for memberships", assignmentResult.error);
    }

    if (rolesResult.error) {
      console.error("Failed to load custom role definitions for memberships", rolesResult.error);
    }

    if (!assignmentResult.error && !rolesResult.error) {
      const roleRows = (rolesResult.data ?? []) as Array<{
        id: string;
        slug: string;
        permissions: unknown;
        is_archived: boolean;
      }>;
      const assignmentRows = (assignmentResult.data ?? []) as Array<{
        member_id: string;
        role_id: string;
        is_active: boolean;
      }>;

      const roleMap = new Map(
        roleRows.map((role) => [
          role.id,
          {
            slug: role.slug,
            permissions: normalizePermissionKeys(role.permissions),
            isArchived: role.is_archived,
          },
        ]),
      );

      memberships = memberships.map((membership) => {
        const assignedRoles = assignmentRows
          .filter((assignment) => assignment.member_id === membership.id && assignment.is_active)
          .map((assignment) => roleMap.get(assignment.role_id))
          .filter(
            (role): role is { slug: string; permissions: PlatformPermissionKey[]; isArchived: boolean } =>
              role !== undefined && role.isArchived === false,
          );

        return {
          ...membership,
          customPermissions: assignedRoles.flatMap((role) => role.permissions),
          customRoleSlugs: assignedRoles.map((role) => role.slug),
        };
      });
    }
  }

  const selectedTenantId = getSelectedTenantId(user);
  const hasExplicitTenantSelection =
    selectedTenantId !== null &&
    memberships.some((membership) => membership.tenant_id === selectedTenantId);

  const currentMembership =
    memberships.find((membership) => membership.tenant_id === selectedTenantId) ??
    memberships[0] ??
    null;

  return {
    user,
    memberships,
    currentTenant: currentMembership?.tenant ?? null,
    currentMembership,
    selectedTenantId,
    hasExplicitTenantSelection,
    requiresTenantSelection: memberships.length > 1 && !hasExplicitTenantSelection,
  };
});

export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext();

  if (!context?.user) {
    throw new Error("Unauthorized");
  }

  return context;
}

export async function switchTenant(
  tenantId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Du må være logget inn for å bytte workspace." };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      success: false,
      error: "Du har ikke tilgang til denne workspacen.",
    };
  }

  const existingMetadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? (user.user_metadata as Record<string, unknown>)
      : {};

  const { error: updateError } = await supabase.auth.updateUser({
    data: {
      ...existingMetadata,
      current_tenant_id: tenantId,
    },
  });

  if (updateError) {
    console.error("Failed to switch tenant", updateError);
    return {
      success: false,
      error: "Kunne ikke bytte workspace akkurat nå.",
    };
  }

  return { success: true };
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Failed to sign out", error);
    return {
      success: false,
      error: "Kunne ikke logge ut akkurat nå.",
    };
  }

  return { success: true };
}

export function getEffectiveRole(
  context: Pick<TenantContext, "currentMembership">,
  moduleKey?: string,
): TenantRole {
  const moduleRoles = context.currentMembership?.moduleRoles;

  if (moduleKey && moduleRoles) {
    const moduleRole = moduleRoles[moduleKey];

    if (
      moduleRole === "owner" ||
      moduleRole === "admin" ||
      moduleRole === "member" ||
      moduleRole === "viewer"
    ) {
      return moduleRole;
    }
  }

  return context.currentMembership?.role ?? "viewer";
}

export function hasAnyTenantRole(
  context: Pick<TenantContext, "currentMembership">,
  roles: TenantRole[],
  moduleKey?: string,
): boolean {
  return roles.includes(getEffectiveRole(context, moduleKey));
}

export function canManageTenantAdministration(
  context: Pick<TenantContext, "currentMembership">,
  moduleKey?: string,
): boolean {
  return hasAnyTenantRole(context, ["owner", "admin"], moduleKey);
}

export function getEffectivePermissions(
  context: Pick<TenantContext, "currentMembership">,
  options?: {
    moduleKey?: string;
    customPermissions?: readonly string[] | readonly PlatformPermissionKey[] | null;
  },
): PermissionMap {
  const role = getEffectiveRole(context, options?.moduleKey);
  const moduleRoles = context.currentMembership?.moduleRoles;
  const modulePayload = options?.moduleKey ? moduleRoles?.[options.moduleKey] : null;
  const modulePermissions =
    modulePayload && typeof modulePayload === "object" && !Array.isArray(modulePayload)
      ? normalizePermissionKeys((modulePayload as { permissions?: unknown }).permissions)
      : [];
  const membershipCustomPermissions = normalizePermissionKeys(
    context.currentMembership?.customPermissions ?? [],
  );
  const customPermissions = normalizePermissionKeys(options?.customPermissions ?? []);

  return createPermissionMap([
    ...DEFAULT_ROLE_PERMISSIONS[role],
    ...modulePermissions,
    ...membershipCustomPermissions,
    ...customPermissions,
  ]);
}

export function hasPermission(
  context: Pick<TenantContext, "currentMembership">,
  permission: PlatformPermissionKey,
  options?: {
    moduleKey?: string;
    customPermissions?: readonly string[] | readonly PlatformPermissionKey[] | null;
  },
): boolean {
  return Boolean(getEffectivePermissions(context, options)[permission]);
}
