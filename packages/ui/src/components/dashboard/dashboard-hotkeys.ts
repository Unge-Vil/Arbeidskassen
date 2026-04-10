import type { Dashboard } from "./dashboard-grid"

export const DASHBOARD_HOTKEY_TIMEOUT_MS = 900

export interface DashboardHotkeyState {
  isDKeyDown: boolean
  lastDKeyAt: number | null
}

export interface DashboardHotkeyEvent {
  type: "keydown" | "keyup" | "blur"
  key?: string
  code?: string
  repeat?: boolean
}

export function createDashboardHotkeyState(): DashboardHotkeyState {
  return {
    isDKeyDown: false,
    lastDKeyAt: null,
  }
}

export function parseDashboardHotkeyInput(value: string): number | null | undefined {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9) {
    return undefined
  }

  return parsed
}

export function shouldIgnoreDashboardHotkeyTarget(target: EventTarget | null) {
  const element = target as {
    tagName?: string | null
    isContentEditable?: boolean
    closest?: (selector: string) => Element | null
  } | null

  const tagName = element?.tagName?.toUpperCase()

  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    Boolean(element?.isContentEditable) ||
    Boolean(element?.closest?.("[data-shortcut-recorder='true']"))
  )
}

export function getDashboardHotkeyDigit(key = "", code?: string) {
  if (/^[1-9]$/.test(key)) {
    return Number.parseInt(key, 10)
  }

  if (code && /^Numpad[1-9]$/.test(code)) {
    return Number.parseInt(code.replace("Numpad", ""), 10)
  }

  return null
}

export function consumeDashboardHotkeyEvent(
  event: DashboardHotkeyEvent,
  state: DashboardHotkeyState,
  now = Date.now(),
) {
  if (event.type === "blur") {
    return {
      hotkey: null,
      state: createDashboardHotkeyState(),
    }
  }

  const normalizedKey = event.key?.toLowerCase()

  if (!normalizedKey) {
    return { hotkey: null, state }
  }

  if (event.type === "keyup") {
    if (normalizedKey === "d") {
      return {
        hotkey: null,
        state: {
          ...state,
          isDKeyDown: false,
        },
      }
    }

    return { hotkey: null, state }
  }

  if (event.repeat) {
    return { hotkey: null, state }
  }

  if (normalizedKey === "d") {
    return {
      hotkey: null,
      state: {
        isDKeyDown: true,
        lastDKeyAt: now,
      },
    }
  }

  const hotkey = getDashboardHotkeyDigit(event.key, event.code)
  const withinSequenceWindow = state.lastDKeyAt !== null && now - state.lastDKeyAt <= DASHBOARD_HOTKEY_TIMEOUT_MS

  if (!hotkey || (!state.isDKeyDown && !withinSequenceWindow)) {
    return { hotkey: null, state }
  }

  return {
    hotkey,
    state: {
      isDKeyDown: state.isDKeyDown,
      lastDKeyAt: state.isDKeyDown ? state.lastDKeyAt : null,
    },
  }
}

export function findDashboardIndexByHotkey(dashboards: Dashboard[], hotkey: number) {
  const matchIndex = dashboards.findIndex((dashboard) => dashboard.hotkey === hotkey)

  if (matchIndex !== -1) {
    return matchIndex
  }

  if (hotkey === 1 && dashboards.length > 0) {
    return 0
  }

  return -1
}
