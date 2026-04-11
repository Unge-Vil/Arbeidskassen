import type { Dashboard } from "./dashboard-grid"

export interface DashboardActionState {
  hasCreateHandler?: boolean
  hasRenameHandler?: boolean
  hasDeleteHandler?: boolean
  hasActiveDashboard: boolean
  isEditing: boolean
  isReadOnly: boolean
  dashboardCount: number
}

export function canCreateDashboard(state: DashboardActionState) {
  return Boolean(state.hasCreateHandler) && !state.isEditing && !state.isReadOnly
}

export function canRenameDashboard(state: DashboardActionState) {
  return Boolean(state.hasRenameHandler) && state.hasActiveDashboard && !state.isReadOnly
}

export function canDeleteDashboard(state: DashboardActionState) {
  return (
    Boolean(state.hasDeleteHandler) &&
    state.hasActiveDashboard &&
    state.dashboardCount > 1 &&
    state.isEditing &&
    !state.isReadOnly
  )
}

function clearConflictingHotkey(dashboard: Dashboard, reservedHotkey?: number) {
  if (typeof reservedHotkey !== "number" || dashboard.hotkey !== reservedHotkey) {
    return dashboard
  }

  return {
    ...dashboard,
    hotkey: undefined,
  }
}

export function mergeCreatedDashboard(previous: Dashboard[], createdDashboard: Dashboard) {
  const nextDashboards = previous.map((dashboard) =>
    dashboard.id === createdDashboard.id ? dashboard : clearConflictingHotkey(dashboard, createdDashboard.hotkey),
  )

  return [...nextDashboards, createdDashboard]
}

export function mergeRenamedDashboard(previous: Dashboard[], updatedDashboard: Dashboard) {
  return previous.map((dashboard) => {
    if (dashboard.id === updatedDashboard.id) {
      return {
        ...dashboard,
        name: updatedDashboard.name,
        hotkey: updatedDashboard.hotkey,
        layout_config: updatedDashboard.layout_config,
      }
    }

    return clearConflictingHotkey(dashboard, updatedDashboard.hotkey)
  })
}
