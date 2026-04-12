import { describe, expect, it } from "vitest";

import {
  createPermissionMap,
  DEFAULT_ROLE_PERMISSIONS,
  normalizePermissionKeys,
  PLATFORM_PERMISSION_KEYS,
  type PlatformPermissionKey,
} from "./permissions";
import {
  getEffectivePermissions,
  getEffectiveRole,
  hasAnyTenantRole,
  hasPermission,
  canManageTenantAdministration,
  type TenantContext,
} from "./auth";

// ── Helper ──────────────────────────────────────────────────────

type MockContext = Pick<TenantContext, "currentMembership">;

function ctx(
  role: "owner" | "admin" | "member" | "viewer",
  overrides?: {
    moduleRoles?: Record<string, unknown>;
    customPermissions?: PlatformPermissionKey[];
  },
): MockContext {
  return {
    currentMembership: {
      role,
      moduleRoles: overrides?.moduleRoles ?? null,
      customPermissions: overrides?.customPermissions ?? [],
      customRoleSlugs: [],
    },
  } as MockContext;
}

// ── Role × Permission Matrix ────────────────────────────────────

describe("role × permission matrix", () => {
  const expectedMatrix: Record<string, Record<string, boolean>> = {
    owner: Object.fromEntries(PLATFORM_PERMISSION_KEYS.map((k) => [k, true])),
    admin: {
      "organization.manage_structure": true,
      "organization.manage_members": true,
      "organization.manage_roles": true,
      "organization.manage_billing": false,
      "bookdet.view": true,
      "bookdet.manage": true,
      "today.view": true,
      "today.manage": true,
      "arbeidskassen.use_tools": true,
      "ai.use": true,
      "ai.manage_credits": true,
    },
    member: {
      "organization.manage_structure": false,
      "organization.manage_members": false,
      "organization.manage_roles": false,
      "organization.manage_billing": false,
      "bookdet.view": true,
      "bookdet.manage": true,
      "today.view": true,
      "today.manage": true,
      "arbeidskassen.use_tools": true,
      "ai.use": true,
      "ai.manage_credits": false,
    },
    viewer: {
      "organization.manage_structure": false,
      "organization.manage_members": false,
      "organization.manage_roles": false,
      "organization.manage_billing": false,
      "bookdet.view": true,
      "bookdet.manage": false,
      "today.view": true,
      "today.manage": false,
      "arbeidskassen.use_tools": true,
      "ai.use": false,
      "ai.manage_credits": false,
    },
  };

  for (const [role, permissions] of Object.entries(expectedMatrix)) {
    describe(`${role} role`, () => {
      const context = ctx(role as "owner" | "admin" | "member" | "viewer");
      const effectivePerms = getEffectivePermissions(context);

      for (const [permKey, expected] of Object.entries(permissions)) {
        it(`${expected ? "✓" : "✗"} ${permKey}`, () => {
          expect(effectivePerms[permKey as PlatformPermissionKey]).toBe(expected);
        });
      }
    });
  }
});

// ── DEFAULT_ROLE_PERMISSIONS consistency checks ─────────────────

describe("DEFAULT_ROLE_PERMISSIONS invariants", () => {
  it("owner has all platform permissions", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.owner).toEqual(
      expect.arrayContaining([...PLATFORM_PERMISSION_KEYS]),
    );
    expect(DEFAULT_ROLE_PERMISSIONS.owner.length).toBe(
      PLATFORM_PERMISSION_KEYS.length,
    );
  });

  it("admin is a subset of owner", () => {
    for (const perm of DEFAULT_ROLE_PERMISSIONS.admin) {
      expect(DEFAULT_ROLE_PERMISSIONS.owner).toContain(perm);
    }
  });

  it("member is a subset of admin", () => {
    for (const perm of DEFAULT_ROLE_PERMISSIONS.member) {
      expect(DEFAULT_ROLE_PERMISSIONS.admin).toContain(perm);
    }
  });

  it("viewer is a subset of member", () => {
    for (const perm of DEFAULT_ROLE_PERMISSIONS.viewer) {
      expect(DEFAULT_ROLE_PERMISSIONS.member).toContain(perm);
    }
  });

  it("every default permission is a known platform permission key", () => {
    for (const role of ["owner", "admin", "member", "viewer"] as const) {
      for (const perm of DEFAULT_ROLE_PERMISSIONS[role]) {
        expect(PLATFORM_PERMISSION_KEYS).toContain(perm);
      }
    }
  });
});

// ── Module role overrides ───────────────────────────────────────

describe("module role overrides", () => {
  it("module role promotes a viewer to admin for that module", () => {
    const context = ctx("viewer", {
      moduleRoles: { bookdet: "admin" },
    });
    const role = getEffectiveRole(context, "bookdet");
    expect(role).toBe("admin");
    expect(hasPermission(context, "bookdet.manage", { moduleKey: "bookdet" })).toBe(
      true,
    );
  });

  it("module role does not bleed into other modules", () => {
    const context = ctx("viewer", {
      moduleRoles: { bookdet: "admin" },
    });
    // Without moduleKey, falls back to base role (viewer)
    expect(getEffectiveRole(context)).toBe("viewer");
    expect(hasPermission(context, "today.manage")).toBe(false);
  });

  it("module permission overrides merge with base role permissions", () => {
    const context = ctx("member", {
      moduleRoles: {
        today: {
          role: "member",
          permissions: ["organization.manage_billing"],
        },
      },
    });

    const perms = getEffectivePermissions(context, { moduleKey: "today" });
    // member base perms + module override
    expect(perms["ai.use"]).toBe(true);
    expect(perms["organization.manage_billing"]).toBe(true);
    // Not granted
    expect(perms["organization.manage_structure"]).toBe(false);
  });
});

// ── Custom role permissions ─────────────────────────────────────

describe("custom role permissions", () => {
  it("custom permissions extend the base role", () => {
    const context = ctx("viewer", {
      customPermissions: ["bookdet.manage", "ai.use"],
    });
    const perms = getEffectivePermissions(context);
    expect(perms["bookdet.view"]).toBe(true); // from viewer defaults
    expect(perms["bookdet.manage"]).toBe(true); // from custom
    expect(perms["ai.use"]).toBe(true); // from custom
    expect(perms["organization.manage_structure"]).toBe(false); // not granted
  });

  it("custom permissions do not downgrade existing permissions", () => {
    const context = ctx("admin", {
      customPermissions: ["bookdet.view"], // admin already has more
    });
    const perms = getEffectivePermissions(context);
    expect(perms["bookdet.manage"]).toBe(true); // still has admin perms
    expect(perms["organization.manage_structure"]).toBe(true);
  });
});

// ── Role guard helpers ──────────────────────────────────────────

describe("role guard helpers", () => {
  it("canManageTenantAdministration is true for owner and admin", () => {
    expect(canManageTenantAdministration(ctx("owner"))).toBe(true);
    expect(canManageTenantAdministration(ctx("admin"))).toBe(true);
    expect(canManageTenantAdministration(ctx("member"))).toBe(false);
    expect(canManageTenantAdministration(ctx("viewer"))).toBe(false);
  });

  it("hasAnyTenantRole checks correctly", () => {
    expect(hasAnyTenantRole(ctx("member"), ["member", "admin"])).toBe(true);
    expect(hasAnyTenantRole(ctx("viewer"), ["member", "admin"])).toBe(false);
  });
});

// ── Permission utilities ────────────────────────────────────────

describe("permission utilities", () => {
  it("createPermissionMap produces a complete map", () => {
    const map = createPermissionMap(["bookdet.view", "ai.use"]);
    expect(map["bookdet.view"]).toBe(true);
    expect(map["ai.use"]).toBe(true);
    expect(map["bookdet.manage"]).toBe(false);
    expect(Object.keys(map).length).toBe(PLATFORM_PERMISSION_KEYS.length);
  });

  it("normalizePermissionKeys filters invalid keys", () => {
    const result = normalizePermissionKeys([
      "bookdet.view",
      "fake.permission",
      42,
      null,
      "ai.use",
    ]);
    expect(result).toEqual(["bookdet.view", "ai.use"]);
  });

  it("normalizePermissionKeys returns empty array for non-array input", () => {
    expect(normalizePermissionKeys(null)).toEqual([]);
    expect(normalizePermissionKeys("bookdet.view")).toEqual([]);
    expect(normalizePermissionKeys({})).toEqual([]);
  });
});
