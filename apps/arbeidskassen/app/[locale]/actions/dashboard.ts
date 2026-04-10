"use server";

import type { Dashboard, DashboardItem } from "@arbeidskassen/ui";
import { createServerClient } from "@arbeidskassen/supabase/server";
import { getSelectedTenantId } from "@arbeidskassen/supabase";
import { revalidatePath } from "next/cache";

type DashboardRow = {
  id: string;
  user_id: string;
  name: string;
  order: number;
  hotkey: number | null;
  layout_config: DashboardItem[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function getDashboardTable(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  return supabase.from("user_dashboards" as never);
}

function mapDashboardRow(row: DashboardRow): Dashboard {
  return {
    id: row.id,
    name: row.name,
    hotkey: row.hotkey ?? undefined,
    layout_config: row.layout_config ?? [],
  };
}

export async function getDashboardsSafe(): Promise<Dashboard[]> {
  try {
    const supabase = await createServerClient();
    const { data: userResponse } = await supabase.auth.getUser();

    if (!userResponse.user) {
      return [];
    }

    const { data, error } = await getDashboardTable(supabase)
      .select("*")
      .order("order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching dashboards safe:", error);
      return [];
    }

    return ((data ?? []) as unknown as DashboardRow[]).map(mapDashboardRow);
  } catch (error) {
    console.error("Safe fetch error", error);
    return [];
  }
}

export async function getDashboards(): Promise<Dashboard[]> {
  const supabase = await createServerClient();
  const { data: userResponse } = await supabase.auth.getUser();

  if (!userResponse.user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await getDashboardTable(supabase)
    .select("*")
    .order("order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching dashboards:", error);
    throw new Error("Failed to fetch dashboards");
  }

  return ((data ?? []) as unknown as DashboardRow[]).map(mapDashboardRow);
}

export async function createDashboard(
  name: string,
  hotkey?: number,
  layoutConfig: DashboardItem[] = [],
): Promise<Dashboard | null> {
  const supabase = await createServerClient();
  const { data: userResponse } = await supabase.auth.getUser();

  if (!userResponse.user) {
    throw new Error("Unauthorized");
  }

  if (hotkey) {
    await getDashboardTable(supabase)
      .update({ hotkey: null } as never)
      .eq("user_id", userResponse.user.id)
      .eq("hotkey", hotkey);
  }

  const { data: existingDashboards } = await getDashboardTable(supabase)
    .select("order")
    .order("order", { ascending: false })
    .limit(1);

  const orders = (existingDashboards ?? []) as unknown as Array<{ order: number }>;
  const nextOrder =
    typeof orders[0]?.order === "number" ? orders[0].order + 1 : 0;

  const insertPayload = [
    {
      user_id: userResponse.user.id,
      tenant_id: getSelectedTenantId(userResponse.user),
      name,
      order: nextOrder,
      hotkey: hotkey ?? null,
      layout_config: layoutConfig,
    },
  ] as unknown as never;

  const { data, error } = await getDashboardTable(supabase)
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("Error creating dashboard:", error);
    throw new Error("Failed to create dashboard");
  }

  revalidatePath("/dashboard");
  return data ? mapDashboardRow(data as unknown as DashboardRow) : null;
}

export async function updateDashboardLayout(
  dashboardId: string,
  layoutConfig: DashboardItem[],
): Promise<void> {
  const supabase = await createServerClient();
  const { data: userResponse } = await supabase.auth.getUser();

  if (!userResponse.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await getDashboardTable(supabase)
    .update(
      {
        layout_config: layoutConfig,
        updated_at: new Date().toISOString(),
      } as never,
    )
    .eq("id", dashboardId)
    .eq("user_id", userResponse.user.id);

  if (error) {
    console.error("Error updating dashboard layout:", error);
    throw new Error("Failed to update layout");
  }

  revalidatePath("/dashboard");
}

export async function updateDashboardName(
  dashboardId: string,
  name: string,
  hotkey?: number,
): Promise<Dashboard | null> {
  const supabase = await createServerClient();
  const { data: userResponse } = await supabase.auth.getUser();

  if (!userResponse.user) {
    throw new Error("Unauthorized");
  }

  const updatePayload: { name: string; updated_at: string; hotkey?: number | null } = {
    name,
    updated_at: new Date().toISOString(),
  };

  if (typeof hotkey !== "undefined") {
    updatePayload.hotkey = hotkey;
    
    if (hotkey) {
      await getDashboardTable(supabase)
        .update({ hotkey: null } as never)
        .eq("user_id", userResponse.user.id)
        .eq("hotkey", hotkey);
    }
  }

  const { data, error } = await getDashboardTable(supabase)
    .update(updatePayload as never)
    .eq("id", dashboardId)
    .eq("user_id", userResponse.user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating dashboard name:", error);
    throw new Error("Failed to update dashboard name");
  }

  revalidatePath("/dashboard");
  return data ? mapDashboardRow(data as unknown as DashboardRow) : null;
}

export async function deleteDashboard(dashboardId: string) {
  const supabase = await createServerClient();
  const { data: userResponse } = await supabase.auth.getUser();

  if (!userResponse.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await getDashboardTable(supabase)
    .delete()
    .eq("id", dashboardId)
    .eq("user_id", userResponse.user.id);

  if (error) {
    console.error("Error deleting dashboard:", error);
    throw new Error("Failed to delete dashboard");
  }

  revalidatePath("/dashboard");
  return { success: true };
}
