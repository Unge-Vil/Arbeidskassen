// @arbeidskassen/ui
// Shared UI components (shadcn/ui-based)
// Export components here as they are created.

export { cn } from "./lib/utils";
export {
  buildArbeidskassenHref,
  buildLocalizedAppHref,
  defaultDisabledModules,
  extractLocaleFromPathname,
  normalizeReturnTo,
  resolveActiveAdminModule,
  resolveAdminAppHrefs,
  resolveInternalAdminHref,
} from "./lib/admin-links";
export {
  ThemeProvider,
  useTheme,
  type ThemePreference,
  type ResolvedTheme,
} from "./components/theme-provider";
export {
  normalizeThemePreference,
  THEME_PREFERENCE_COOKIE,
  THEME_PREFERENCE_STORAGE_KEY,
} from "./components/theme-utils";
export {
  Navbar,
  ModuleTabs,
  SearchOverlay,
  ProfileMenu,
  type NavbarProps,
  type ModuleTab,
  type TenantOption,
} from "./components/navbar";
export {
  ModuleComingSoonPage,
  type ModuleComingSoonAction,
  type ModuleComingSoonFeature,
  type ModuleComingSoonMilestone,
  type ModuleComingSoonStatusItem,
} from "./components/module-coming-soon";
export { AppErrorState } from "./components/feedback/app-error-state";

// shadcn/ui components
export * from "./components/ui/alert";
export * from "./components/ui/badge";
export * from "./components/ui/button";
export * from "./components/ui/card";
export * from "./components/ui/dialog";
export * from "./components/ui/dropdown-menu";
export * from "./components/ui/form";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/popover";
export * from "./components/ui/select";
export * from "./components/ui/sheet";
export * from "./components/ui/sonner";
export * from "./components/ui/table";
export * from "./components/ui/tabs";
export * from "./components/ui/select-native";
export * from "./components/ui/page-header";
export * from "./components/ui/status-badge";

export { useDashboardStore } from "./components/dashboard/dashboard-store";
export { DashboardOverlay } from "./components/dashboard/dashboard-overlay";
export {
  DashboardGrid,
  type Dashboard,
  type DashboardItem,
} from "./components/dashboard/dashboard-grid";
export { registerDashboardWidgets } from "./components/dashboard/register-dashboard-widgets";

export {
  WidgetRegistry,
  type WidgetConfig,
  type WidgetSize,
  type WidgetCategory,
} from "./components/dashboard/widget-registry";

export { AppIconWidget, type AppIconWidgetProps } from "./components/dashboard/widgets/app-icon-widget";
export { CalculatorWidget } from "./components/dashboard/widgets/calculator-widget";
export { MetricWidget, type MetricWidgetProps } from "./components/dashboard/widgets/metric-widget";
export { QuickActionsWidget, type QuickActionsWidgetProps } from "./components/dashboard/widgets/quick-actions-widget";
export { StatusListWidget, type StatusListWidgetProps } from "./components/dashboard/widgets/status-list-widget";
