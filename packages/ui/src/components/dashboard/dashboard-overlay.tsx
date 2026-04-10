"use client";
import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { DashboardGrid, type Dashboard } from "./dashboard-grid"
import {
  consumeDashboardHotkeyEvent,
  createDashboardHotkeyState,
  findDashboardIndexByHotkey,
  shouldIgnoreDashboardHotkeyTarget,
} from "./dashboard-hotkeys"
import { useDashboardStore } from "./dashboard-store"

const EMPTY_DASHBOARDS: Dashboard[] = []

export function DashboardOverlay({
  initialDashboards = EMPTY_DASHBOARDS,
  fetchDashboards,
}: {
  initialDashboards?: Dashboard[]
  fetchDashboards?: () => Promise<Dashboard[]>
}) {
  const { isOpen, setDashboardOpen, activeDashboardIndex } = useDashboardStore()
  const [dashboards, setDashboards] = React.useState(initialDashboards)
  const fetchRef = React.useRef(fetchDashboards)
  const dashboardsRef = React.useRef(dashboards)
  const overlayStateRef = React.useRef({ isOpen, activeDashboardIndex })
  const hotkeyStateRef = React.useRef(createDashboardHotkeyState())

  fetchRef.current = fetchDashboards

  React.useEffect(() => {
    dashboardsRef.current = dashboards
  }, [dashboards])

  React.useEffect(() => {
    overlayStateRef.current = { isOpen, activeDashboardIndex }
  }, [isOpen, activeDashboardIndex])

  const refreshDashboards = React.useCallback(async () => {
    if (fetchRef.current) {
      try {
        setDashboards(await fetchRef.current())
      } catch (error) {
        console.error("Failed to refresh dashboards", error)
      }
      return
    }

    setDashboards(initialDashboards)
  }, [initialDashboards])

  React.useEffect(() => {
    refreshDashboards()
  }, [refreshDashboards])

  React.useEffect(() => {
    if (!isOpen) return
    refreshDashboards()
  }, [isOpen, refreshDashboards])

  React.useEffect(() => {
    const handleDashboardSync = (event: Event) => {
      const nextDashboards = (event as CustomEvent<Dashboard[]>).detail

      if (Array.isArray(nextDashboards)) {
        setDashboards(nextDashboards)
      }
    }

    window.addEventListener("arbeidskassen:dashboards-updated", handleDashboardSync as EventListener)

    return () => {
      window.removeEventListener("arbeidskassen:dashboards-updated", handleDashboardSync as EventListener)
    }
  }, [])

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (shouldIgnoreDashboardHotkeyTarget(event.target)) {
        return
      }

      const result = consumeDashboardHotkeyEvent(
        { type: "keydown", key: event.key, code: event.code, repeat: event.repeat },
        hotkeyStateRef.current,
      )
      hotkeyStateRef.current = result.state

      if (result.hotkey === null) {
        return
      }

      const targetIndex = findDashboardIndexByHotkey(dashboardsRef.current, result.hotkey)

      if (targetIndex === -1) {
        return
      }

      event.preventDefault()

      const currentState = overlayStateRef.current

      if (currentState.isOpen && currentState.activeDashboardIndex === targetIndex) {
        setDashboardOpen(false)
        return
      }

      setDashboardOpen(true, targetIndex)
    }

    const up = (event: KeyboardEvent) => {
      hotkeyStateRef.current = consumeDashboardHotkeyEvent(
        { type: "keyup", key: event.key, code: event.code },
        hotkeyStateRef.current,
      ).state
    }

    const blur = () => {
      hotkeyStateRef.current = createDashboardHotkeyState()
    }

    document.addEventListener("keydown", down)
    document.addEventListener("keyup", up)
    window.addEventListener("blur", blur)

    return () => {
      document.removeEventListener("keydown", down)
      document.removeEventListener("keyup", up)
      window.removeEventListener("blur", blur)
    }
  }, [setDashboardOpen])

  const currentDashboardName = dashboards[activeDashboardIndex]?.name || `Mitt Dashbord ${activeDashboardIndex + 1}`

  return (
    <Dialog.Root open={isOpen} onOpenChange={setDashboardOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-0 z-50 flex w-full flex-col overflow-y-auto p-6 pt-16 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <Dialog.Title className="sr-only">Dashboard {activeDashboardIndex + 1}</Dialog.Title>
          <Dialog.Description className="sr-only">Arbeidskassen Dashboard Hotkey Overlay</Dialog.Description>

          <div className="relative mx-auto flex min-h-[calc(100vh-100px)] w-full max-w-[95vw] flex-1 flex-col rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]/95 p-6 shadow-2xl backdrop-blur-xl">
            <header className="mb-8 flex items-center justify-between border-b border-[var(--ak-border-soft)] pb-4">
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">OVERLAY DASHBOARD (Read-only)</p>
                <h2 className="text-3xl font-bold text-[var(--ak-text-main)]">{currentDashboardName}</h2>
              </div>
              <Dialog.Close className="rounded-full p-2 text-[var(--ak-text-muted)] transition-colors hover:bg-[var(--ak-bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="sr-only">Lukk</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Dialog.Close>
            </header>

            <DashboardGrid initialDashboards={dashboards} isReadOnly={true} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
