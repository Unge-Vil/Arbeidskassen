"use client";
import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { useDashboardStore } from "./dashboard-store"
import { DashboardGrid } from "./dashboard-grid"

export function DashboardOverlay({ 
  initialDashboards = [],
  fetchDashboards,
}: { 
  initialDashboards?: import('./dashboard-grid').Dashboard[]
  fetchDashboards?: () => Promise<import('./dashboard-grid').Dashboard[]>
}) {
  const { isOpen, setDashboardOpen, activeDashboardIndex } = useDashboardStore()
  const [dashboards, setDashboards] = React.useState(initialDashboards)
  const fetchRef = React.useRef(fetchDashboards)
  fetchRef.current = fetchDashboards

  React.useEffect(() => {
    if (fetchRef.current) {
      fetchRef.current().then(setDashboards).catch(console.error)
    } else {
      setDashboards(initialDashboards)
    }
  }, [initialDashboards])

  React.useEffect(() => {
    let dPressed = false

    const down = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement).isContentEditable
      ) {
        return
      }

      if (e.key.toLowerCase() === "d") {
        dPressed = true
      }

      if (dPressed && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        const pressedKey = parseInt(e.key)
        const matchIndex = dashboards.findIndex(d => d.hotkey === pressedKey)
        
        let targetIndex = matchIndex
        if (targetIndex === -1 && pressedKey === 1 && dashboards.length > 0) {
          // Fallback D+1 to the very first dashboard if none has hotkey 1
          targetIndex = 0
        }

        if (targetIndex !== -1) {
          if (isOpen && activeDashboardIndex === targetIndex) {
            setDashboardOpen(false) // Toggle off if already open on same
          } else {
            setDashboardOpen(true, targetIndex)
          }
        }
      }
    }

    const up = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") {
        dPressed = false
      }
    }

    document.addEventListener("keydown", down)
    document.addEventListener("keyup", up)
    
    // Clear dPressed on window blur to avoid stuck state
    const blur = () => { dPressed = false }
    window.addEventListener("blur", blur)

    return () => {
      document.removeEventListener("keydown", down)
      document.removeEventListener("keyup", up)
      window.removeEventListener("blur", blur)
    }
  }, [setDashboardOpen, isOpen, activeDashboardIndex, dashboards])

  const currentDashboardName = dashboards[activeDashboardIndex]?.name || `Mitt Dashbord ${activeDashboardIndex + 1}`

  return (
    <Dialog.Root open={isOpen} onOpenChange={setDashboardOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col p-6 pt-16 overflow-y-auto w-full outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <Dialog.Title className="sr-only">Dashboard {activeDashboardIndex + 1}</Dialog.Title>
          <Dialog.Description className="sr-only">Arbeidskassen Dashboard Hotkey Overlay</Dialog.Description>
          
          <div className="w-full max-w-[95vw] mx-auto flex-1 flex flex-col min-h-[calc(100vh-100px)] rounded-2xl bg-[var(--ak-bg-main)]/95 backdrop-blur-xl border border-[var(--ak-border-soft)] shadow-2xl p-6 relative">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--ak-border-soft)]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)] mb-1">OVERLAY DASHBOARD (Read-only)</p>
                <h2 className="text-3xl font-bold text-[var(--ak-text-main)]">{currentDashboardName}</h2>
              </div>
              <Dialog.Close className="text-[var(--ak-text-muted)] hover:bg-[var(--ak-bg-hover)] p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
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
