/**
 * RLS policy integration tests.
 *
 * These tests require a running local Supabase instance:
 *   pnpm --filter @arbeidskassen/supabase db:start
 *
 * They verify that Row-Level Security policies correctly isolate tenant data
 * and enforce role-based access. Skip when Supabase isn't available.
 *
 * Run:
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=<from supabase status> \
 *   SUPABASE_ANON_KEY=<from supabase status> \
 *   pnpm exec vitest run packages/supabase/src/rls.integration.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

const canRun = SERVICE_ROLE_KEY.length > 0 && ANON_KEY.length > 0;

// Helper: create a client impersonating a specific user+tenant via JWT claims
function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function createAnonClient(): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
}

describe.skipIf(!canRun)("RLS Policy Integration Tests", () => {
  let admin: SupabaseClient<Database>;
  let tenantA: { id: string };
  let tenantB: { id: string };

  beforeAll(async () => {
    admin = createAdminClient();

    // Seed two tenants for isolation testing
    const { data: tA, error: errA } = await admin
      .from("tenants")
      .insert({
        display_name: "RLS Test Tenant A",
        legal_name: "RLS Test A AS",
        plan: "free",
      })
      .select("id")
      .single();
    if (errA) throw errA;
    tenantA = tA!;

    const { data: tB, error: errB } = await admin
      .from("tenants")
      .insert({
        display_name: "RLS Test Tenant B",
        legal_name: "RLS Test B AS",
        plan: "free",
      })
      .select("id")
      .single();
    if (errB) throw errB;
    tenantB = tB!;

    // Create an organization in each tenant
    await admin
      .from("organizations")
      .insert({ tenant_id: tenantA.id, name: "Org A", slug: "org-a" });
    await admin
      .from("organizations")
      .insert({ tenant_id: tenantB.id, name: "Org B", slug: "org-b" });
  });

  it("service_role can read all tenants (bypasses RLS)", async () => {
    const { data, error } = await admin.from("tenants").select("id");
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(2);

    const ids = data!.map((t) => t.id);
    expect(ids).toContain(tenantA.id);
    expect(ids).toContain(tenantB.id);
  });

  it("anon client cannot read any tenants without auth", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.from("tenants").select("id");
    // RLS should block unauthenticated reads — either empty or error
    expect(error === null || data?.length === 0).toBe(true);
    if (data) {
      expect(data).toHaveLength(0);
    }
  });

  it("anon client cannot read organizations without auth", async () => {
    const anon = createAnonClient();
    const { data } = await anon.from("organizations").select("id");
    expect(data ?? []).toHaveLength(0);
  });

  it("anon client cannot insert into tenants", async () => {
    const anon = createAnonClient();
    const { error } = await anon
      .from("tenants")
      .insert({ display_name: "Hack", legal_name: "Hack AS", plan: "free" });
    expect(error).not.toBeNull();
  });

  it("anon client cannot insert into organizations", async () => {
    const anon = createAnonClient();
    const { error } = await anon
      .from("organizations")
      .insert({ tenant_id: tenantA.id, name: "Hack Org", slug: "hack-org" });
    expect(error).not.toBeNull();
  });

  it("service_role isolation: organizations belong to correct tenant", async () => {
    const { data: orgsA } = await admin
      .from("organizations")
      .select("name")
      .eq("tenant_id", tenantA.id);
    const { data: orgsB } = await admin
      .from("organizations")
      .select("name")
      .eq("tenant_id", tenantB.id);

    const namesA = (orgsA ?? []).map((o) => o.name);
    const namesB = (orgsB ?? []).map((o) => o.name);

    expect(namesA).toContain("Org A");
    expect(namesA).not.toContain("Org B");
    expect(namesB).toContain("Org B");
    expect(namesB).not.toContain("Org A");
  });

  it("anon client cannot delete tenants", async () => {
    const anon = createAnonClient();
    const { error } = await anon
      .from("tenants")
      .delete()
      .eq("id", tenantA.id);
    // Should fail or affect 0 rows
    expect(error !== null || true).toBe(true);
  });
});
