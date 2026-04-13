"use client";

import * as React from "react";
import { ArrowRight, Plus } from "lucide-react";

import { resolveInternalAdminHref } from "../../../lib/admin-links";

export interface QuickActionItem {
  label: string;
  href?: string;
  description?: string;
  disabled?: boolean;
}

export interface QuickActionsWidgetProps {
  title?: string;
  actions?: QuickActionItem[];
}

const defaultActions: QuickActionItem[] = [
  { label: "Ny booking", href: "/bookdet", description: "Opprett og del bookinglenke" },
  { label: "Nytt tilbud", href: "/sales-portal", description: "Start ny salgsdialog" },
  { label: "Åpne backoffice", href: "/backoffice", description: "Administrasjon og drift" },
];

export function QuickActionsWidget({
  title = "Hurtighandlinger",
  actions = defaultActions,
}: QuickActionsWidgetProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-4">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ak-accent)]/10 text-[var(--ak-accent)]">
          <Plus className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ak-text-main)]">{title}</p>
          <p className="text-xs text-[var(--ak-text-muted)]">Snarveier til de vanligste handlingene</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {actions.map((action) => {
          const resolvedHref = action.href
            ? resolveInternalAdminHref(action.href)
            : action.href
          const isDisabled = action.disabled || !resolvedHref || resolvedHref === "#"

          if (isDisabled) {
            return (
              <div
                key={`${action.label}-${action.href ?? "disabled"}`}
                className="rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3 opacity-55"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--ak-text-main)]">{action.label}</p>
                    <p className="mt-1 text-xs text-[var(--ak-text-muted)]">
                      {action.description ?? "Denne snarveien kommer snart."}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--ak-border-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--ak-text-muted)]">
                    Snart
                  </span>
                </div>
              </div>
            )
          }

          return (
            <a
              key={`${action.label}-${resolvedHref}`}
              href={resolvedHref}
              className="group rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 py-3 transition-colors hover:bg-[var(--ak-bg-hover)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--ak-text-main)]">{action.label}</p>
                  {action.description ? (
                    <p className="mt-1 text-xs text-[var(--ak-text-muted)]">{action.description}</p>
                  ) : null}
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--ak-text-muted)] transition-transform group-hover:translate-x-0.5" />
              </div>
            </a>
          )
        })}
      </div>
    </div>
  );
}
