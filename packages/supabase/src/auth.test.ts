import { describe, expect, it } from "vitest";

import {
  getSelectedTenantId,
  normalizeModuleRoles,
  normalizeTenant,
} from "./auth";

describe("tenant context helpers", () => {
  it("prefers the app metadata tenant selection", () => {
    const tenantId = getSelectedTenantId({
      app_metadata: { current_tenant_id: "tenant-app" },
      user_metadata: { current_tenant_id: "tenant-user" },
    } as never);

    expect(tenantId).toBe("tenant-app");
  });

  it("falls back to user metadata when needed", () => {
    const tenantId = getSelectedTenantId({
      app_metadata: {},
      user_metadata: { current_tenant_id: "tenant-user" },
    } as never);

    expect(tenantId).toBe("tenant-user");
  });

  it("keeps only object-based module role payloads", () => {
    expect(normalizeModuleRoles({ bookdet: { role: "admin" } })).toEqual({
      bookdet: { role: "admin" },
    });
    expect(normalizeModuleRoles(null)).toBeNull();
    expect(normalizeModuleRoles(["admin"])).toBeNull();
    expect(normalizeModuleRoles("admin")).toBeNull();
  });

  it("normalizes tenant responses from single rows or arrays", () => {
    const tenant = { id: "tenant-1", name: "Arbeidskassen" };

    expect(normalizeTenant(tenant)).toEqual(tenant);
    expect(normalizeTenant([tenant])).toEqual(tenant);
    expect(normalizeTenant([])).toBeNull();
    expect(normalizeTenant(null)).toBeNull();
  });
});
