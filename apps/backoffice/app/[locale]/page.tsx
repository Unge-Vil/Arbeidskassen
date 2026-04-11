"use client";

import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import {
  DashboardGrid,
  Navbar,
  defaultDisabledModules,
  resolveActiveAdminModule,
  resolveAdminAppHrefs,
} from "@arbeidskassen/ui";

export default function Home() {
  const pathname = usePathname();
  const activeModule = resolveActiveAdminModule(pathname);
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === "string" ? params.locale : "no";
  const appHrefs = useMemo(() => resolveAdminAppHrefs(locale), [locale]);

  const dashboards = useMemo(
    () => [
      {
        id: "platform-overview",
        name: "Plattform",
        layout_config: [
          {
            i: "1",
            widgetId: "Metric",
            x: 0,
            y: 0,
            w: 3,
            h: 2,
            props: {
              label: "MRR",
              value: "45 230",
              unit: "NOK",
              trend: "+12%",
              subtitle: "mot forrige måned",
              tone: "success",
            },
          },
          {
            i: "2",
            widgetId: "Metric",
            x: 3,
            y: 0,
            w: 3,
            h: 2,
            props: {
              label: "Aktive tenants",
              value: 18,
              trend: "+2",
              subtitle: "denne måneden",
            },
          },
          {
            i: "3",
            widgetId: "StatusList",
            x: 6,
            y: 0,
            w: 3,
            h: 4,
            props: {
              title: "Driftsstatus",
              items: [
                { label: "Betalinger", value: "OK", detail: "Ingen feil siste døgn", status: "ok" },
                { label: "API-varsler", value: 2, detail: "1 bør følges opp", status: "warning" },
                { label: "Supportkø", value: 5, detail: "2 høy prioritet", status: "warning" },
              ],
            },
          },
          {
            i: "4",
            widgetId: "QuickActions",
            x: 9,
            y: 0,
            w: 3,
            h: 4,
            props: {
              title: "Adminhandlinger",
              actions: [
                { label: "Åpne sales portal", href: appHrefs.salesPortal, description: "Se pipeline og partnere" },
                { label: "Åpne Bookdet", href: appHrefs.booking, description: "Kontroller bookingflyt" },
                { label: "Til arbeidskassen", href: appHrefs.dashboard, description: "Gå til operativt dashboard" },
              ],
            },
          },
          { i: "5", widgetId: "Calculator", x: 0, y: 2, w: 4, h: 4 },
          { i: "6", widgetId: "AppIcon", x: 4, y: 2, w: 2, h: 2, props: { label: "Sales", href: appHrefs.salesPortal } },
          { i: "7", widgetId: "AppIcon", x: 4, y: 4, w: 2, h: 2, props: { label: "Bookdet", href: appHrefs.booking } },
        ],
      },
      {
        id: "support-overview",
        name: "Support",
        layout_config: [
          {
            i: "1",
            widgetId: "Metric",
            x: 0,
            y: 0,
            w: 3,
            h: 2,
            props: {
              label: "Saker åpne",
              value: 14,
              trend: "-2",
              subtitle: "siden i går",
              tone: "warning",
            },
          },
          {
            i: "2",
            widgetId: "StatusList",
            x: 3,
            y: 0,
            w: 4,
            h: 4,
            props: {
              title: "Supportstatus",
              items: [
                { label: "Høy prioritet", value: 2, detail: "Bør håndteres først", status: "critical" },
                { label: "Venter kunde", value: 6, detail: "Følg opp innen 24t", status: "neutral" },
                { label: "Løst i dag", value: 9, detail: "Sterk fremdrift", status: "ok" },
              ],
            },
          },
          {
            i: "3",
            widgetId: "QuickActions",
            x: 7,
            y: 0,
            w: 5,
            h: 4,
            props: {
              title: "Neste steg",
              actions: [
                { label: "Gå til kundesaker", description: "Kommer snart i backoffice", disabled: true },
                { label: "Opprett intern oppgave", description: "Kommer snart i backoffice", disabled: true },
                { label: "Eksporter oversikt", description: "Kommer snart i backoffice", disabled: true },
              ],
            },
          },
        ],
      },
    ],
    [appHrefs],
  );

  return (
    <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-[var(--ak-bg-main)] font-sans text-[var(--ak-text-main)] transition-colors duration-300">
      <Navbar
        workspaceName="Backoffice"
        workspaceInitial="B"
        orgName="Platform Admin"
        activeModule={activeModule}
        onModuleChange={() => undefined}
        moduleHrefs={{
          dashboard: appHrefs.dashboard,
          today: appHrefs.today,
          teamarea: appHrefs.teamarea,
          booking: appHrefs.booking,
        }}
        disabledModules={[...defaultDisabledModules]}
      />

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-screen-2xl overflow-y-auto p-8 disable-scrollbars">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ak-text-main)]">
              Backoffice kontrollsenter
            </h1>
            <p className="mt-1 text-[var(--ak-text-muted)]">
              Dette er første versjon av et felles dashboard-shell for plattformdrift og support.
            </p>
          </div>

          <DashboardGrid locale={locale} initialDashboards={dashboards} />
        </div>
      </main>
    </div>
  );
}
