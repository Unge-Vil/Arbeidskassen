"use client";

import * as React from "react"
import { cn } from "../../lib/utils"
import { Check, LayoutTemplate, Pencil, PenSquare, Plus, Trash2, X } from "lucide-react"
import { ResponsiveGridLayout, type Layout, useContainerWidth } from "react-grid-layout"
import { registerDashboardWidgets } from "./register-dashboard-widgets"
import {
  canCreateDashboard,
  canDeleteDashboard,
  canRenameDashboard,
  mergeCreatedDashboard,
  mergeRenamedDashboard,
} from "./dashboard-actions"
import { parseDashboardHotkeyInput } from "./dashboard-hotkeys"
import { WidgetRegistry, widgetSizeToDimensions } from "./widget-registry"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from "../ui/dialog"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

registerDashboardWidgets()

export interface DashboardItem {
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
}

export interface Dashboard {
  id: string
  name: string
  layout_config: DashboardItem[]
  hotkey?: number
}

interface DashboardGridProps {
  className?: string
  initialDashboards: Dashboard[]
  onSaveLayout?: (dashboardId: string, layout: DashboardItem[]) => Promise<void>
  onCreateDashboard?: (name: string, hotkey: number | undefined, layout: DashboardItem[]) => Promise<Dashboard | null | undefined>
  onRenameDashboard?: (dashboardId: string, name: string, hotkey?: number | null) => Promise<Dashboard | null | undefined>
  onDeleteDashboard?: (dashboardId: string) => Promise<unknown>
  isReadOnly?: boolean
}

const cloneProps = (props?: object) => {
  if (!props) return undefined

  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(props) as Record<string, unknown>
  }

  return JSON.parse(JSON.stringify(props)) as Record<string, unknown>
}

export function DashboardGrid({
  className,
  initialDashboards,
  onSaveLayout,
  onCreateDashboard,
  onRenameDashboard,
  onDeleteDashboard,
  isReadOnly = false,
}: DashboardGridProps) {
  const [dashboards, setDashboards] = React.useState<Dashboard[]>(initialDashboards)
  const [activeDashboardId, setActiveDashboardId] = React.useState<string>(initialDashboards[0]?.id || "")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [draftLayout, setDraftLayout] = React.useState<DashboardItem[]>([])

  const { width: containerWidth, containerRef } = useContainerWidth()
  const availableWidgets = React.useMemo(() => WidgetRegistry.getAll(), [])

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const [formName, setFormName] = React.useState("")
  const [formHotkey, setFormHotkey] = React.useState("")

  const resetDashboardForm = React.useCallback(() => {
    setFormName("")
    setFormHotkey("")
  }, [])

  const handleHotkeyInputChange = (value: string) => {
    const normalized = value.replace(/\D/g, "").slice(0, 1)
    setFormHotkey(normalized === "0" ? "" : normalized)
  }

  React.useEffect(() => {
    setDashboards(initialDashboards)
    setActiveDashboardId((currentId) => {
      if (!currentId) return initialDashboards[0]?.id || ""
      return initialDashboards.some((dashboard) => dashboard.id === currentId)
        ? currentId
        : initialDashboards[0]?.id || ""
    })
  }, [initialDashboards])

  const activeDashboard = dashboards.find((dashboard) => dashboard.id === activeDashboardId)
  const dashboardActionState = {
    hasCreateHandler: Boolean(onCreateDashboard),
    hasRenameHandler: Boolean(onRenameDashboard),
    hasDeleteHandler: Boolean(onDeleteDashboard),
    hasActiveDashboard: Boolean(activeDashboard),
    isEditing,
    isReadOnly,
    dashboardCount: dashboards.length,
  }

  const broadcastDashboards = React.useCallback(
    (nextDashboards: Dashboard[]) => {
      if (isReadOnly || typeof window === "undefined") return

      window.dispatchEvent(
        new CustomEvent("arbeidskassen:dashboards-updated", {
          detail: nextDashboards,
        }),
      )
    },
    [isReadOnly],
  )

  React.useEffect(() => {
    broadcastDashboards(dashboards)
  }, [broadcastDashboards, dashboards])

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false)
      setDraftLayout([])
      return
    }

    setIsEditing(true)
    setDraftLayout(activeDashboard?.layout_config || [])
  }

  const handleSave = async () => {
    if (!activeDashboard) return

    setIsSaving(true)
    try {
      if (onSaveLayout) {
        await onSaveLayout(activeDashboardId, draftLayout)
      }

      setDashboards((previous) =>
        previous.map((dashboard) =>
          dashboard.id === activeDashboardId ? { ...dashboard, layout_config: draftLayout } : dashboard,
        ),
      )
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to save layout", err)
      alert("Kunne ikke lagre layouten.")
    } finally {
      setIsSaving(false)
      setDraftLayout([])
    }
  }

  const handleCreateDashboardClick = () => {
    if (!canCreateDashboard(dashboardActionState)) return
    setFormName(`Dashbord ${dashboards.length + 1}`)
    setFormHotkey("")
    setCreateDialogOpen(true)
  }

  const handleCreateDashboardExecute = async () => {
    if (!onCreateDashboard) return

    const name = formName.trim()
    if (!name) return

    const parsedHotkey = parseDashboardHotkeyInput(formHotkey)

    if (formHotkey.trim() && typeof parsedHotkey === "undefined") {
      alert("Snarveien må være et tall mellom 1 og 9.")
      return
    }

    const starterLayout: DashboardItem[] = [
      {
        i: `widget-${Date.now()}`,
        widgetId: "Metric",
        x: 0,
        y: 0,
        w: 3,
        h: 2,
        minW: 1,
        minH: 1,
        maxW: 12,
        maxH: 12,
        props: {
          label: "Nytt dashbord",
          value: "Klar",
          subtitle: "Legg til widgets for å komme i gang",
        },
      },
    ]

    setIsSaving(true)
    try {
      const createdDashboard = await onCreateDashboard(name, parsedHotkey ?? undefined, starterLayout)
      if (!createdDashboard) {
        alert("Kunne ikke opprette dashbordet. Prøv igjen.")
        return
      }

      setDashboards((previous) => mergeCreatedDashboard(previous, createdDashboard))
      setActiveDashboardId(createdDashboard.id)
      setCreateDialogOpen(false)
      resetDashboardForm()
    } catch (err) {
      console.error("Failed to create dashboard", err)
      alert("Kunne ikke opprette dashbordet.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRenameDashboardClick = () => {
    if (!canRenameDashboard(dashboardActionState) || !activeDashboard) return
    setFormName(activeDashboard.name)
    setFormHotkey(activeDashboard.hotkey?.toString() || "")
    setRenameDialogOpen(true)
  }

  const handleRenameDashboardExecute = async () => {
    if (!onRenameDashboard || !activeDashboard) return

    const nextName = formName.trim()
    if (!nextName) return

    const parsedHotkey = parseDashboardHotkeyInput(formHotkey)

    if (formHotkey.trim() && typeof parsedHotkey === "undefined") {
      alert("Snarveien må være et tall mellom 1 og 9.")
      return
    }

    setIsSaving(true)
    try {
      const updatedDashboard = await onRenameDashboard(activeDashboard.id, nextName, parsedHotkey)
      if (!updatedDashboard) {
        alert("Kunne ikke oppdatere dashbordet. Prøv igjen.")
        return
      }

      setDashboards((previous) => mergeRenamedDashboard(previous, updatedDashboard))
      setRenameDialogOpen(false)
      resetDashboardForm()
    } catch (err) {
      console.error("Failed to rename dashboard", err)
      alert("Kunne ikke gi nytt navn til dashbordet.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDashboardClick = () => {
    if (!canDeleteDashboard(dashboardActionState) || !activeDashboard) return
    setDeleteDialogOpen(true)
  }

  const handleDeleteDashboardExecute = async () => {
    if (!onDeleteDashboard || !activeDashboard) return

    setIsSaving(true)
    try {
      await onDeleteDashboard(activeDashboard.id)
      const remainingDashboards = dashboards.filter((dashboard) => dashboard.id !== activeDashboard.id)
      setDashboards(remainingDashboards)
      setActiveDashboardId(remainingDashboards[0]?.id || "")
      setDraftLayout([])
      setIsEditing(false)
      setDeleteDialogOpen(false)
    } catch (err) {
      console.error("Failed to delete dashboard", err)
      alert("Kunne ikke slette dashbordet.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLayoutChange = (newLayout: Layout) => {
    if (!isEditing) return

    const newConfig = newLayout.map((item) => {
      const layoutItem = item as Layout[number] & { i: string }
      const existingItem = draftLayout.find((widget) => widget.i === layoutItem.i)
      return {
        ...existingItem,
        ...layoutItem,
      } as DashboardItem
    })

    setDraftLayout(newConfig)
  }

  const removeWidget = (id: string) => {
    setDraftLayout((previous) => previous.filter((widget) => widget.i !== id))
  }

  const addWidget = (widgetId: string) => {
    const widgetDef = WidgetRegistry.get(widgetId)
    if (!widgetDef) return

    const newId = `widget-${Date.now()}`
    const dimensions = widgetSizeToDimensions[widgetDef.defaultSize]

    let maxY = 0
    draftLayout.forEach((widget) => {
      if (widget.y + widget.h > maxY) maxY = widget.y + widget.h
    })

    const newItem: DashboardItem = {
      i: newId,
      widgetId: widgetDef.id,
      x: 0,
      y: maxY,
      w: dimensions.w,
      h: dimensions.h,
      minW: 1,
      minH: 1,
      maxW: 12,
      maxH: 12,
      props: cloneProps(widgetDef.defaultProps),
    }

    setDraftLayout((previous) => [...previous, newItem])
  }

  const renderWidgetContent = (item: DashboardItem) => {
    const widgetDef = WidgetRegistry.get(item.widgetId)

    if (!widgetDef) {
      return (
        <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--ak-border-soft)] p-4">
          <span className="text-center text-xs text-[var(--ak-text-muted)]">Ukjent widget: {item.widgetId}</span>
        </div>
      )
    }

    const WidgetComponent = widgetDef.component
    const widgetProps = { ...(item.props ?? {}) } as Record<string, unknown>
    return <WidgetComponent {...widgetProps} />
  }

  if (!activeDashboard) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-8", className)}>
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ak-text-muted)]">Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--ak-text-main)]">Ingen dashbord ennå</h2>
          <p className="mt-2 text-sm text-[var(--ak-text-muted)]">
            Opprett ditt første dashbord for å begynne å bygge arbeidsflaten din.
          </p>

          {onCreateDashboard && !isReadOnly ? (
            <button
              onClick={handleCreateDashboardClick}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-4 py-2 text-sm font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)]"
            >
              <Plus className="h-4 w-4" />
              Opprett første dashbord
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const currentLayout = isEditing ? draftLayout : activeDashboard.layout_config

  return (
    <div className={cn("flex h-[calc(100vh-200px)] flex-col overflow-y-auto pr-2 disable-scrollbars", className)}>
      <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 bg-[var(--ak-bg-main)] py-2">
        <div className="flex flex-wrap items-center gap-2">
          {dashboards.map((dashboard) => (
            <button
              key={dashboard.id}
              onClick={() => {
                if (!isEditing) setActiveDashboardId(dashboard.id)
              }}
              disabled={isEditing}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                activeDashboardId === dashboard.id
                  ? "border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)]"
                  : "border-transparent bg-transparent text-[var(--ak-text-muted)] hover:bg-[var(--ak-bg-hover)]",
              )}
            >
              {dashboard.name}
            </button>
          ))}

          {onCreateDashboard && !isReadOnly ? (
            <button
              onClick={handleCreateDashboardClick}
              disabled={isEditing || isSaving}
              className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-sm font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Nytt dashbord
            </button>
          ) : null}
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {canRenameDashboard(dashboardActionState) ? (
              <button
                onClick={handleRenameDashboardClick}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-2 text-sm font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PenSquare className="h-4 w-4" />
                Gi nytt navn
              </button>
            ) : null}

            {isEditing ? (
              <>
                {canDeleteDashboard(dashboardActionState) ? (
                  <button
                    onClick={handleDeleteDashboardClick}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Slett
                  </button>
                ) : null}

                {isSaving ? (
                  <span className="animate-pulse text-sm font-medium text-[var(--ak-text-muted)]">Lagrer...</span>
                ) : (
                  <>
                    <button
                      onClick={handleEditToggle}
                      className="inline-flex items-center gap-2 rounded-lg bg-[var(--ak-bg-hover)] px-4 py-2 text-sm font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-card)]"
                    >
                      <X className="h-4 w-4" />
                      Avbryt
                    </button>
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-4 py-2 text-sm font-medium text-[var(--ak-text-main)] shadow-sm transition-colors hover:border-black"
                    >
                      <Check className="h-4 w-4" />
                      Lagre layout
                    </button>
                  </>
                )}
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-4 py-2 text-sm font-medium text-[var(--ak-text-main)] shadow-sm transition-colors hover:bg-[var(--ak-bg-hover)]"
              >
                <Pencil className="h-4 w-4" />
                Rediger layout
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mb-6 rounded-xl border border-dashed border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-4 shadow-xs animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="mb-3 flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-[var(--ak-text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--ak-text-main)]">Legg til widgets</h3>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {availableWidgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => addWidget(widget.id)}
                className="rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3 text-left transition-colors hover:bg-[var(--ak-bg-hover)]"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ak-text-main)]">
                  <Plus className="h-4 w-4 text-[var(--ak-accent)]" />
                  {widget.name}
                </div>
                <p className="mt-1 text-xs text-[var(--ak-text-muted)]">{widget.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1" ref={containerRef as React.Ref<HTMLDivElement>}>
        {containerWidth > 0 ? (
          <ResponsiveGridLayout
            width={containerWidth}
            className={cn("layout", isEditing && !isReadOnly ? "rounded-xl bg-[var(--ak-bg-hover)]/50" : "")}
            layouts={{ lg: currentLayout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            margin={[20, 20]}
            containerPadding={isEditing && !isReadOnly ? [20, 20] : [0, 0]}
            dragConfig={{ enabled: isEditing && !isReadOnly }}
            resizeConfig={{ enabled: isEditing && !isReadOnly }}
            onLayoutChange={handleLayoutChange}
          >
            {currentLayout.map((item) => (
              <div
                key={item.i}
                data-grid={{
                  i: item.i,
                  x: item.x,
                  y: item.y,
                  w: item.w,
                  h: item.h,
                  minW: 1,
                  minH: 1,
                  maxW: 12,
                  maxH: 12,
                }}
                className={cn(
                  "group relative overflow-hidden rounded-xl border bg-[var(--ak-bg-card)] shadow-sm transition-colors focus-visible:outline-none select-none",
                  isEditing
                    ? "cursor-grab border-dashed border-[var(--ak-border-soft)] hover:border-blue-500 active:cursor-grabbing"
                    : "border-[var(--ak-border-soft)]",
                )}
              >
                {isEditing ? (
                  <>
                    <div className="pointer-events-none absolute inset-0 z-10 transition-colors group-hover:bg-transparent" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeWidget(item.i)
                      }}
                      className="absolute right-2 top-2 z-20 rounded-full bg-red-100 p-1.5 text-red-600 opacity-0 transition-opacity hover:bg-red-200 group-hover:opacity-100"
                      title="Fjern widget"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : null}

                <div className={cn("h-full w-full", isEditing && "pointer-events-none opacity-60")}>
                  {renderWidgetContent(item)}
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        ) : null}
      </div>

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) resetDashboardForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opprett nytt dashbord</DialogTitle>
            <DialogDescription>Gi dashbordet ditt et navn og valgfri snarvei.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Navn</Label>
              <Input
                id="create-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="F.eks. Månedlig salg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-hotkey">Tastatur-snarvei (1-9)</Label>
              <Input
                id="create-hotkey"
                type="number"
                min="1"
                max="9"
                value={formHotkey}
                onChange={(e) => handleHotkeyInputChange(e.target.value)}
                placeholder="Valgfritt (F.eks. 2 for D+2)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleCreateDashboardExecute} disabled={isSaving}>Opprett dashbord</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open)
          if (!open) resetDashboardForm()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Endre dashbord</DialogTitle>
            <DialogDescription>Endre navn eller snarvei på dette dashbordet.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-name">Navn</Label>
              <Input
                id="rename-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Navn"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rename-hotkey">Tastatur-snarvei (1-9)</Label>
              <Input
                id="rename-hotkey"
                type="number"
                min="1"
                max="9"
                value={formHotkey}
                onChange={(e) => handleHotkeyInputChange(e.target.value)}
                placeholder="Valgfritt"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Avbryt</Button>
            <Button onClick={handleRenameDashboardExecute} disabled={isSaving}>Lagre endringer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slett dashbord</DialogTitle>
            <DialogDescription>
              Er du sikker? Sletting av &quot;{activeDashboard?.name}&quot; kan ikke angres.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Avbryt</Button>
            <Button variant="destructive" onClick={handleDeleteDashboardExecute} disabled={isSaving}>Slett dashbord</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
