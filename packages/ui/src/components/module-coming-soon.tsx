"use client";

import { ArrowRight, Clock3, Layers3, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

import { defaultDisabledModules } from "../lib/admin-links";
import { cn } from "../lib/utils";
import { Navbar } from "./navbar";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export type ModuleComingSoonAction = {
  label: string;
  href: string;
};

export type ModuleComingSoonStatusItem = {
  label: string;
  value: string;
  detail: string;
};

export type ModuleComingSoonFeature = {
  title: string;
  description: string;
  badge?: string;
  icon?: ReactNode;
};

export type ModuleComingSoonMilestone = {
  title: string;
  description: string;
};

export interface ModuleComingSoonPageProps {
  appName: string;
  workspaceInitial: string;
  activeModule: string;
  orgName?: string;
  badge: string;
  title: string;
  description: string;
  primaryAction: ModuleComingSoonAction;
  secondaryAction?: ModuleComingSoonAction;
  statusItems: ModuleComingSoonStatusItem[];
  featureCards: ModuleComingSoonFeature[];
  milestones: ModuleComingSoonMilestone[];
  moduleHrefs?: Partial<Record<string, string>>;
}

export function ModuleComingSoonPage({
  appName,
  workspaceInitial,
  activeModule,
  orgName = "Arbeidskassen",
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
  statusItems,
  featureCards,
  milestones,
  moduleHrefs,
}: ModuleComingSoonPageProps) {
  const [currentModule, setCurrentModule] = useState(activeModule);

  const handleModuleChange = (nextModule: string) => {
    setCurrentModule(nextModule);
  };

  return (
    <div className="flex h-screen w-full select-none flex-col overflow-hidden bg-[var(--ak-bg-main)] font-sans text-[var(--ak-text-main)] transition-colors duration-300">
      <Navbar
        appName={appName}
        workspaceName={appName}
        workspaceInitial={workspaceInitial}
        orgName={orgName}
        activeModule={currentModule}
        onModuleChange={handleModuleChange}
        moduleHrefs={moduleHrefs}
        disabledModules={[...defaultDisabledModules]}
      />

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-screen-2xl overflow-y-auto p-4 sm:p-6 lg:p-8">
          <section className="rounded-[28px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-6 shadow-sm sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ak-text-muted)]">
              <Clock3 size={14} className="text-[var(--ak-accent)]" />
              {badge}
            </div>

            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-[var(--ak-text-muted)] sm:text-[15px]">
                  {description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button asChild>
                  <a href={primaryAction.href}>
                    {primaryAction.label}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>
                {secondaryAction ? (
                  <Button asChild variant="outline">
                    <a href={secondaryAction.href}>{secondaryAction.label}</a>
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {statusItems.map((item) => (
                <div
                  key={`${item.label}-${item.value}`}
                  className="rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ak-text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--ak-text-main)]">{item.value}</p>
                  <p className="mt-1 text-[13px] leading-5 text-[var(--ak-text-muted)]">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {featureCards.map((card) => (
              <Card key={card.title} className="rounded-2xl border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)]">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-base text-[var(--ak-accent)]">
                      {card.icon ?? <Sparkles size={16} />}
                    </div>
                    {card.badge ? (
                      <span className="rounded-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ak-text-muted)]">
                        {card.badge}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription className="mt-1.5 text-[13px] leading-5">
                      {card.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-3">
            {milestones.map((milestone, index) => (
              <Card key={milestone.title} className="rounded-2xl border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)]">
                <CardHeader>
                  <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ak-text-muted)]">
                    <Layers3 size={13} />
                    Steg {index + 1}
                  </div>
                  <CardTitle className="text-base">{milestone.title}</CardTitle>
                  <CardDescription className="text-[13px] leading-5">
                    {milestone.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2 text-[12px] text-[var(--ak-text-muted)]",
                      index === 0
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)]"
                    )}
                  >
                    {index === 0 ? "Dette er fokus i første versjon." : "Planlagt som neste iterasjon."}
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
