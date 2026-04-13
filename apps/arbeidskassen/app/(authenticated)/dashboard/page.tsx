import {
  resolveAdminAppHrefs,
  type Dashboard,
  type DashboardItem,
} from "@arbeidskassen/ui"
import {
  createDashboard,
  deleteDashboard,
  getDashboards,
  updateDashboardLayout,
  updateDashboardName,
} from "../../actions/dashboard"
import { getLocale } from "next-intl/server"
import { DashboardGridClient } from "./dashboard-grid-client"

export default async function DashboardPage() {
  const locale = await getLocale()
  const appHrefs = resolveAdminAppHrefs(locale)
  let dashboards: Dashboard[] = []
  
  try {
    dashboards = await getDashboards()
  } catch (err) {
    console.error("Dashboard fetch error:", err)
    dashboards = []
  }

  // Fallback if no dashboard exists
  if (!dashboards || dashboards.length === 0) {
    try {
      const defaultLayout: DashboardItem[] = [
        {
          i: "1",
          widgetId: "Metric",
          w: 3,
          h: 2,
          x: 0,
          y: 0,
          props: {
            label: "Dagens bookinger",
            value: "12",
            trend: "+3",
            subtitle: "siste 24 timer",
            tone: "success",
          },
        },
        {
          i: "2",
          widgetId: "Metric",
          w: 3,
          h: 2,
          x: 3,
          y: 0,
          props: {
            label: "AI credits",
            value: "184",
            trend: "+24",
            subtitle: "tilgjengelig akkurat nå",
          },
        },
        {
          i: "3",
          widgetId: "StatusList",
          w: 3,
          h: 4,
          x: 6,
          y: 0,
          props: {
            title: "Nåstatus",
            items: [
              { label: "Åpne saker", value: 4, detail: "2 haster", status: "warning" },
              { label: "Team online", value: 7, detail: "3 i møte", status: "ok" },
              { label: "Feil i sync", value: 1, detail: "Må sjekkes", status: "critical" },
            ],
          },
        },
        {
          i: "4",
          widgetId: "QuickActions",
          w: 3,
          h: 4,
          x: 9,
          y: 0,
          props: {
            title: "Hurtighandlinger",
            actions: [
              { label: "Åpne Backoffice", href: appHrefs.backoffice, description: "Administrasjon og drift" },
              { label: "Åpne Bookdet", href: appHrefs.booking, description: "Booking og kalender" },
              { label: "Åpne Sales Portal", href: appHrefs.salesPortal, description: "Pipeline og tilbud" },
            ],
          },
        },
        { i: "5", widgetId: "Calculator", w: 4, h: 4, x: 0, y: 2 },
        { i: "6", widgetId: "AppIcon", w: 2, h: 2, x: 4, y: 2, props: { label: "Backoffice", href: appHrefs.backoffice } },
        { i: "7", widgetId: "AppIcon", w: 2, h: 2, x: 4, y: 4, props: { label: "Bookdet", href: appHrefs.booking } },
        { i: "8", widgetId: "AppIcon", w: 2, h: 2, x: 6, y: 4, props: { label: "Sales", href: appHrefs.salesPortal } },
      ]
      const newDashboard = await createDashboard("Hoveddashbord", undefined, defaultLayout)
      if (newDashboard) dashboards = [newDashboard]
    } catch {
      // Fallback gracefully
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8 w-full max-w-screen-2xl mx-auto disable-scrollbars">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--ak-text-main)] tracking-tight">
          God morgen 👋
        </h1>
        <p className="mt-1 text-[var(--ak-text-muted)]">
          Dette er din arbeidsflate. Dra og slipp ikonene og verktøyene slik det passer deg best.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--ak-text-muted)]">
          <span className="rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-2 py-1 font-semibold text-[var(--ak-text-main)]">
            D + 1-9
          </span>
          <span>Åpne overlayet og hopp mellom dashbord fra hele plattformen.</span>
        </div>
      </div>

      {dashboards.length > 0 ? (
        <DashboardGridClient
          locale={locale}
          initialDashboards={dashboards}
          onSaveLayout={updateDashboardLayout}
          onCreateDashboard={createDashboard}
          onRenameDashboard={updateDashboardName}
          onDeleteDashboard={deleteDashboard}
        />
      ) : (
        <div className="text-[var(--ak-text-muted)]">Kunne ikke laste databasen.</div>
      )}
    </div>
  )
}
