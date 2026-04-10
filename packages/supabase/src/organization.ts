import { getTenantContext, type TenantRole } from "./auth";
import { createServerClient } from "./server";
import type { Database } from "./types";

type OrganizationRecord = Database["public"]["Tables"]["organizations"]["Row"];
type DepartmentRecord = Database["public"]["Tables"]["departments"]["Row"];
type SubDepartmentRecord = Database["public"]["Tables"]["sub_departments"]["Row"];
type TenantMembershipRecord = Database["public"]["Tables"]["tenant_members"]["Row"];
type AuditLogRecord = Database["public"]["Tables"]["audit_logs"]["Row"];

type TenantCollections = {
  organizations: OrganizationRecord[];
  departments: DepartmentRecord[];
  subDepartments: SubDepartmentRecord[];
  memberships: TenantMembershipRecord[];
};

export type TenantDirectoryMember = {
  id: string;
  userId: string;
  userLabel: string;
  role: TenantRole;
  joinedAt: string;
  orgName: string | null;
  deptName: string | null;
  subDepartmentName: string | null;
  isCurrentUser: boolean;
};

export type TenantStructureSummary = {
  organizations: Array<{
    id: string;
    name: string;
    organizationNumber: string | null;
    slug: string | null;
    isArchived: boolean;
    departmentCount: number;
    subDepartmentCount: number;
    memberCount: number;
  }>;
  departments: Array<{
    id: string;
    name: string;
    description: string | null;
    orgName: string | null;
    isArchived: boolean;
    subDepartmentCount: number;
    memberCount: number;
  }>;
  subDepartments: Array<{
    id: string;
    name: string;
    description: string | null;
    departmentName: string | null;
    orgName: string | null;
    isArchived: boolean;
    memberCount: number;
  }>;
};

export type TenantActivityItem = {
  id: string;
  action: AuditLogRecord["action"];
  tableName: string;
  recordId: string;
  createdAt: string;
};

function createRowMap<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

function getMemberLabel(userId: string): string {
  return `Bruker ${userId.slice(0, 8)}`;
}

export function summarizeTenantDirectory({
  currentUserId,
  organizations,
  departments,
  subDepartments,
  memberships,
}: TenantCollections & {
  currentUserId: string | null;
}): TenantDirectoryMember[] {
  const organizationMap = createRowMap(organizations);
  const departmentMap = createRowMap(departments);
  const subDepartmentMap = createRowMap(subDepartments);

  return memberships
    .filter((membership) => membership.is_active)
    .map((membership) => {
      const organization = membership.org_id
        ? organizationMap.get(membership.org_id) ?? null
        : null;
      const department = membership.dept_id
        ? departmentMap.get(membership.dept_id) ?? null
        : null;
      const subDepartment = membership.sub_department_id
        ? subDepartmentMap.get(membership.sub_department_id) ?? null
        : null;

      return {
        id: membership.id,
        userId: membership.user_id,
        userLabel: getMemberLabel(membership.user_id),
        role: membership.role,
        joinedAt: membership.created_at,
        orgName: organization?.name ?? null,
        deptName: department?.name ?? null,
        subDepartmentName: subDepartment?.name ?? null,
        isCurrentUser: currentUserId === membership.user_id,
      } satisfies TenantDirectoryMember;
    })
    .sort((left, right) => left.joinedAt.localeCompare(right.joinedAt));
}

export function summarizeTenantStructure({
  organizations,
  departments,
  subDepartments,
  memberships,
}: TenantCollections): TenantStructureSummary {
  const organizationMap = createRowMap(organizations);
  const departmentMap = createRowMap(departments);

  return {
    organizations: organizations.map((organization) => ({
      id: organization.id,
      name: organization.name,
      organizationNumber: organization.organization_number,
      slug: organization.slug,
      isArchived: organization.is_archived,
      departmentCount: departments.filter((department) => department.org_id === organization.id)
        .length,
      subDepartmentCount: subDepartments.filter((subDepartment) => {
        const department = departmentMap.get(subDepartment.dept_id);
        return department?.org_id === organization.id;
      }).length,
      memberCount: memberships.filter((membership) => membership.org_id === organization.id).length,
    })),
    departments: departments.map((department) => ({
      id: department.id,
      name: department.name,
      description: department.description,
      orgName: organizationMap.get(department.org_id)?.name ?? null,
      isArchived: department.is_archived,
      subDepartmentCount: subDepartments.filter(
        (subDepartment) => subDepartment.dept_id === department.id,
      ).length,
      memberCount: memberships.filter((membership) => membership.dept_id === department.id).length,
    })),
    subDepartments: subDepartments.map((subDepartment) => {
      const department = departmentMap.get(subDepartment.dept_id) ?? null;
      const organization = department ? organizationMap.get(department.org_id) ?? null : null;

      return {
        id: subDepartment.id,
        name: subDepartment.name,
        description: subDepartment.description,
        departmentName: department?.name ?? null,
        orgName: organization?.name ?? null,
        isArchived: subDepartment.is_archived,
        memberCount: memberships.filter(
          (membership) => membership.sub_department_id === subDepartment.id,
        ).length,
      };
    }),
  };
}

export function summarizeTenantActivity(logs: AuditLogRecord[]): TenantActivityItem[] {
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    tableName: log.table_name,
    recordId: log.record_id,
    createdAt: log.created_at,
  }));
}

async function getTenantCollections(tenantId: string): Promise<TenantCollections> {
  const supabase = await createServerClient();

  const [organizationsResult, departmentsResult, subDepartmentsResult, membershipsResult] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, organization_number, slug, is_archived, tenant_id, address, contact, cost_center, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true }),
      supabase
        .from("departments")
        .select("id, name, description, org_id, is_archived, tenant_id, manager_id, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true }),
      supabase
        .from("sub_departments")
        .select("id, name, description, dept_id, is_archived, tenant_id, manager_id, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .order("name", { ascending: true }),
      supabase
        .from("tenant_members")
        .select(
          "id, user_id, role, is_active, tenant_id, org_id, dept_id, sub_department_id, module_roles, created_at, updated_at",
        )
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
    ]);

  if (organizationsResult.error) {
    console.error("Failed to load organizations", organizationsResult.error);
  }

  if (departmentsResult.error) {
    console.error("Failed to load departments", departmentsResult.error);
  }

  if (subDepartmentsResult.error) {
    console.error("Failed to load sub-departments", subDepartmentsResult.error);
  }

  if (membershipsResult.error) {
    console.error("Failed to load tenant members", membershipsResult.error);
  }

  return {
    organizations: organizationsResult.data ?? [],
    departments: departmentsResult.data ?? [],
    subDepartments: subDepartmentsResult.data ?? [],
    memberships: membershipsResult.data ?? [],
  };
}

export async function getCurrentTenantDirectory(): Promise<TenantDirectoryMember[] | null> {
  const context = await getTenantContext();

  if (!context?.user || !context.currentTenant) {
    return null;
  }

  const collections = await getTenantCollections(context.currentTenant.id);

  return summarizeTenantDirectory({
    ...collections,
    currentUserId: context.user.id,
  });
}

export async function getCurrentTenantStructure(): Promise<TenantStructureSummary | null> {
  const context = await getTenantContext();

  if (!context?.currentTenant) {
    return null;
  }

  const collections = await getTenantCollections(context.currentTenant.id);
  return summarizeTenantStructure(collections);
}

export async function getCurrentTenantActivity(
  limit = 12,
): Promise<TenantActivityItem[] | null> {
  const context = await getTenantContext();

  if (!context?.currentTenant) {
    return null;
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, table_name, record_id, created_at, tenant_id, changed_by, ip_address, new_data, old_data, user_agent")
    .eq("tenant_id", context.currentTenant.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load tenant activity", error);
    return [];
  }

  return summarizeTenantActivity(data ?? []);
}
