import type { User } from "@supabase/supabase-js";
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
  | "tenant_id"
  | "role"
  | "is_active"
  | "org_id"
  | "dept_id"
  | "sub_department_id"
> & {
  moduleRoles: Record<string, unknown> | null;
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

export async function getTenantContext(): Promise<TenantContext | null> {
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

  const memberships = ((data ?? []) as TenantQueryRow[])
    .map((membership) => {
      const tenant = normalizeTenant(membership.tenants);

      if (!tenant) {
        return null;
      }

      return {
        tenant_id: membership.tenant_id,
        role: membership.role,
        is_active: membership.is_active,
        org_id: membership.org_id,
        dept_id: membership.dept_id,
        sub_department_id: membership.sub_department_id,
        moduleRoles: normalizeModuleRoles(membership.module_roles),
        tenant,
      } satisfies TenantMembership;
    })
    .filter((membership): membership is TenantMembership => membership !== null);

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
}

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
