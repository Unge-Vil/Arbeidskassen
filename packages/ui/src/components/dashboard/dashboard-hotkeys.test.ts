import { describe, expect, it } from "vitest"

import {
  DASHBOARD_HOTKEY_TIMEOUT_MS,
  consumeDashboardHotkeyEvent,
  createDashboardHotkeyState,
  findDashboardIndexByHotkey,
  parseDashboardHotkeyInput,
} from "./dashboard-hotkeys"

describe("dashboard hotkeys", () => {
  it("supports holding D while pressing a number", () => {
    const started = consumeDashboardHotkeyEvent(
      { type: "keydown", key: "d", code: "KeyD" },
      createDashboardHotkeyState(),
      100,
    )

    const triggered = consumeDashboardHotkeyEvent(
      { type: "keydown", key: "2", code: "Digit2" },
      started.state,
      120,
    )

    expect(triggered.hotkey).toBe(2)
  })

  it("also supports tapping D and then a number shortly after", () => {
    const started = consumeDashboardHotkeyEvent(
      { type: "keydown", key: "d", code: "KeyD" },
      createDashboardHotkeyState(),
      100,
    )

    const released = consumeDashboardHotkeyEvent(
      { type: "keyup", key: "d", code: "KeyD" },
      started.state,
      140,
    )

    const triggered = consumeDashboardHotkeyEvent(
      { type: "keydown", key: "3", code: "Digit3" },
      released.state,
      180,
    )

    expect(triggered.hotkey).toBe(3)

    const secondDigit = consumeDashboardHotkeyEvent(
      { type: "keydown", key: "4", code: "Digit4" },
      triggered.state,
      220,
    )

    expect(secondDigit.hotkey).toBeNull()
  })

  it("ignores stale sequences after the timeout window", () => {
    const started = consumeDashboardHotkeyEvent(
      { type: "keydown", key: "d", code: "KeyD" },
      createDashboardHotkeyState(),
      100,
    )

    const released = consumeDashboardHotkeyEvent(
      { type: "keyup", key: "d", code: "KeyD" },
      started.state,
      140,
    )

    const triggered = consumeDashboardHotkeyEvent(
      { type: "keydown", key: "5", code: "Digit5" },
      released.state,
      140 + DASHBOARD_HOTKEY_TIMEOUT_MS + 1,
    )

    expect(triggered.hotkey).toBeNull()
  })

  it("normalizes dashboard hotkey inputs and fallback lookup", () => {
    expect(parseDashboardHotkeyInput("")).toBeNull()
    expect(parseDashboardHotkeyInput("8")).toBe(8)
    expect(parseDashboardHotkeyInput("11")).toBeUndefined()

    const dashboards = [
      { id: "first", name: "Hoved", layout_config: [] },
      { id: "second", name: "Salg", layout_config: [], hotkey: 2 },
    ]

    expect(findDashboardIndexByHotkey(dashboards, 2)).toBe(1)
    expect(findDashboardIndexByHotkey(dashboards, 1)).toBe(0)
    expect(findDashboardIndexByHotkey(dashboards, 9)).toBe(-1)
  })
})
