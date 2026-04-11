import { describe, expect, it } from "vitest"

import {
  canCreateDashboard,
  canDeleteDashboard,
  canRenameDashboard,
  mergeCreatedDashboard,
  mergeRenamedDashboard,
  type DashboardActionState,
} from "./dashboard-actions"

const baseState: DashboardActionState = {
  hasCreateHandler: true,
  hasRenameHandler: true,
  hasDeleteHandler: true,
  hasActiveDashboard: true,
  isEditing: false,
  isReadOnly: false,
  dashboardCount: 2,
}

describe("dashboard-actions", () => {
  it("allows renaming even when layout edit mode is off", () => {
    expect(canRenameDashboard(baseState)).toBe(true)
  })

  it("still requires layout edit mode to delete dashboards", () => {
    expect(canDeleteDashboard(baseState)).toBe(false)
    expect(canDeleteDashboard({ ...baseState, isEditing: true })).toBe(true)
  })

  it("only allows creating dashboards outside layout edit mode", () => {
    expect(canCreateDashboard(baseState)).toBe(true)
    expect(canCreateDashboard({ ...baseState, isEditing: true })).toBe(false)
  })

  it("clears conflicting hotkeys when a dashboard is renamed", () => {
    const next = mergeRenamedDashboard(
      [
        { id: "alpha", name: "Alpha", layout_config: [], hotkey: 2 },
        { id: "beta", name: "Beta", layout_config: [], hotkey: 4 },
      ],
      { id: "beta", name: "Beta oppdatert", layout_config: [], hotkey: 2 },
    )

    expect(next).toEqual([
      { id: "alpha", name: "Alpha", layout_config: [], hotkey: undefined },
      { id: "beta", name: "Beta oppdatert", layout_config: [], hotkey: 2 },
    ])
  })

  it("clears conflicting hotkeys when a dashboard is created", () => {
    const next = mergeCreatedDashboard(
      [{ id: "alpha", name: "Alpha", layout_config: [], hotkey: 3 }],
      { id: "beta", name: "Beta", layout_config: [], hotkey: 3 },
    )

    expect(next).toEqual([
      { id: "alpha", name: "Alpha", layout_config: [], hotkey: undefined },
      { id: "beta", name: "Beta", layout_config: [], hotkey: 3 },
    ])
  })
})
