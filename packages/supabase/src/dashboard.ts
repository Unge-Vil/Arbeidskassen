"use server";

import { createServerClient } from "./server";

export type DashboardItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  widgetId: string;
  props?: Record<string, unknown>;
};

export type UserDashboard = {
  id: string;
  name: string;
  layout_config: DashboardItem[];
  hotkey?: number;
};

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

function mapDashboardRow(row: DashboardRow): UserDashboard {
  return {
    id: row.id,
    name: row.name,
    hotkey: row.hotkey ?? undefined,
    layout_config: row.layout_config ?? [],
  };
}

export async function getCurrentUserDashboardsSafe(): Promise<UserDashboard[]> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Failed to resolve dashboards for current user", userError);
      return [];
    }

    if (!user) {
      return [];
    }

    const { data, error } = await getDashboardTable(supabase)
      .select("*")
      .eq("user_id", user.id)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch dashboards safely", error);
      return [];
    }

    return ((data ?? []) as unknown as DashboardRow[]).map(mapDashboardRow);
  } catch (error) {
    console.error("Unexpected safe dashboard fetch error", error);
    return [];
  }
}
