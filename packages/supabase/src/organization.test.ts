import { describe, expect, it } from "vitest";

import {
  summarizeTenantDirectory,
  summarizeTenantStructure,
} from "./organization";

describe("organization helpers", () => {
  it("maps tenant members to readable directory items", () => {
    const directory = summarizeTenantDirectory({
      currentUserId: "user-1",
      memberships: [
        {
          id: "member-1",
          tenant_id: "tenant-1",
          user_id: "user-1",
          role: "owner",
          is_active: true,
          org_id: "org-1",
          dept_id: "dept-1",
          sub_department_id: "sub-1",
          module_roles: {},
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
      ],
      organizations: [
        {
          id: "org-1",
          tenant_id: "tenant-1",
          name: "Unge Vil",
          organization_number: null,
          slug: "unge-vil",
          cost_center: null,
          address: {},
          contact: {},
          is_archived: false,
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
      ],
      departments: [
        {
          id: "dept-1",
          tenant_id: "tenant-1",
          org_id: "org-1",
          name: "Design",
          description: null,
          manager_id: null,
          is_archived: false,
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
      ],
      subDepartments: [
        {
          id: "sub-1",
          tenant_id: "tenant-1",
          dept_id: "dept-1",
          name: "Prosjektlab",
          description: null,
          manager_id: null,
          is_archived: false,
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
      ],
    });

    expect(directory).toEqual([
      {
        id: "member-1",
        userId: "user-1",
        userLabel: "Bruker user-1",
        role: "owner",
        joinedAt: "2026-04-10T09:00:00.000Z",
        orgName: "Unge Vil",
        deptName: "Design",
        subDepartmentName: "Prosjektlab",
        isCurrentUser: true,
      },
    ]);
  });

  it("calculates organization, department and sub-department counts", () => {
    const structure = summarizeTenantStructure({
      memberships: [
        {
          id: "member-1",
          tenant_id: "tenant-1",
          user_id: "user-1",
          role: "owner",
          is_active: true,
          org_id: "org-1",
          dept_id: "dept-1",
          sub_department_id: null,
          module_roles: {},
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
        {
          id: "member-2",
          tenant_id: "tenant-1",
          user_id: "user-2",
          role: "member",
          is_active: true,
          org_id: "org-1",
          dept_id: "dept-1",
          sub_department_id: "sub-1",
          module_roles: {},
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
      ],
      organizations: [
        {
          id: "org-1",
          tenant_id: "tenant-1",
          name: "Unge Vil",
          organization_number: "999888777",
          slug: "unge-vil",
          cost_center: null,
          address: {},
          contact: {},
          is_archived: false,
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
      ],
      departments: [
        {
          id: "dept-1",
          tenant_id: "tenant-1",
          org_id: "org-1",
          name: "Design",
          description: null,
          manager_id: null,
          is_archived: false,
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
      ],
      subDepartments: [
        {
          id: "sub-1",
          tenant_id: "tenant-1",
          dept_id: "dept-1",
          name: "Prosjektlab",
          description: null,
          manager_id: null,
          is_archived: false,
          created_at: "2026-04-10T09:00:00.000Z",
          updated_at: "2026-04-10T09:00:00.000Z",
        },
      ],
    });

    expect(structure.organizations[0]).toMatchObject({
      name: "Unge Vil",
      departmentCount: 1,
      subDepartmentCount: 1,
      memberCount: 2,
    });

    expect(structure.departments[0]).toMatchObject({
      name: "Design",
      orgName: "Unge Vil",
      subDepartmentCount: 1,
      memberCount: 2,
    });

    expect(structure.subDepartments[0]).toMatchObject({
      name: "Prosjektlab",
      departmentName: "Design",
      orgName: "Unge Vil",
      memberCount: 1,
    });
  });
});
