"use server";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "./admin";
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

function mapDashboardRow(row: DashboardRow): UserDashboard {
  return {
    id: row.id,
    name: row.name,
    hotkey: row.hotkey ?? undefined,
    layout_config: row.layout_config ?? [],
  };
}

// Cached across requests — uses admin client (no request-time cookies).
// Cache key includes userId so each user gets their own cache entry.
const fetchDashboardsForUser = unstable_cache(
  async (userId: string): Promise<UserDashboard[]> => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("user_dashboards" as never)
      .select("*")
      .eq("user_id", userId)
      .order("order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to fetch dashboards for user", error);
      return [];
    }

    return ((data ?? []) as unknown as DashboardRow[]).map(mapDashboardRow);
  },
  ["user-dashboards"],
  { tags: ["dashboards"], revalidate: 30 },
);

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

    return fetchDashboardsForUser(user.id);
  } catch (error) {
    console.error("Unexpected safe dashboard fetch error", error);
    return [];
  }
}
