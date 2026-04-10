import { WidgetRegistry } from "./widget-registry";
import { AppIconWidget } from "./widgets/app-icon-widget";
import { CalculatorWidget } from "./widgets/calculator-widget";
import { MetricWidget } from "./widgets/metric-widget";
import { QuickActionsWidget } from "./widgets/quick-actions-widget";
import { StatusListWidget } from "./widgets/status-list-widget";

let hasRegistered = false;

export function registerDashboardWidgets() {
  if (hasRegistered) return;
  hasRegistered = true;

  WidgetRegistry.register({
    id: "Metric",
    name: "Nøkkeltall",
    description: "Vis et viktig KPI-kort eller en statusmåling.",
    defaultSize: "2x2",
    category: "overview",
    component: MetricWidget,
    defaultProps: {
      label: "Dagens bookinger",
      value: "12",
      trend: "+3",
      subtitle: "siste 24 timer",
      tone: "success",
    },
  });

  WidgetRegistry.register({
    id: "StatusList",
    name: "Statusliste",
    description: "Få en rask oversikt over drift, team og oppgaver.",
    defaultSize: "2x4",
    category: "overview",
    component: StatusListWidget,
  });

  WidgetRegistry.register({
    id: "QuickActions",
    name: "Hurtighandlinger",
    description: "Samle de vanligste handlingene i ett panel.",
    defaultSize: "2x4",
    category: "actions",
    component: QuickActionsWidget,
  });

  WidgetRegistry.register({
    id: "AppIcon",
    name: "App-snarvei",
    description: "Lenk til en modul eller ekstern side.",
    defaultSize: "2x2",
    category: "apps",
    component: AppIconWidget,
    defaultProps: {
      label: "Ny app",
      href: "#",
    },
  });

  WidgetRegistry.register({
    id: "Calculator",
    name: "Kalkulator",
    description: "Et enkelt verktøy for raske utregninger.",
    defaultSize: "4x4",
    category: "tools",
    component: CalculatorWidget,
  });
}
