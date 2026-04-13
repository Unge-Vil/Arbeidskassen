"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckSquare,
  MessageCircle,
  Globe,
  CalendarDays,
  LayoutGrid,
  AlignJustify,
  Folder,
  MessageSquare,
  Grip,
  User,
  Building2,
  Users,
  LogOut,
  Zap,
  Sun,
  Moon,
  Star,
  Monitor,
  ChevronRight,
  Check,
  Bell,
} from "lucide-react";
import { cn } from "../lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { useTheme } from "./theme-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";

export interface ModuleTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const defaultModules: ModuleTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutGrid size={14} strokeWidth={2.5} />,
  },
  {
    id: "today",
    label: "Today",
    icon: <CheckSquare size={14} strokeWidth={2.5} />,
  },
  {
    id: "chat",
    label: "Chat",
    icon: <MessageCircle size={14} strokeWidth={2.5} />,
  },
  {
    id: "teamarea",
    label: "TeamArea",
    icon: <Globe size={14} strokeWidth={2.5} />,
  },
  {
    id: "booking",
    label: "Booking",
    icon: <CalendarDays size={14} strokeWidth={2.5} />,
  },
  {
    id: "moodboard",
    label: "Moodboard",
    icon: <LayoutGrid size={14} strokeWidth={2.5} />,
  },
  {
    id: "fastnotes",
    label: "FastNotes",
    icon: <AlignJustify size={14} strokeWidth={2.5} />,
  }
];

interface ModuleTabsProps {
  modules?: ModuleTab[];
  activeModule: string;
  onModuleChange: (id: string) => void;
  disabledModules?: string[];
  className?: string;
}

export function ModuleTabs({
  modules = defaultModules,
  activeModule,
  onModuleChange,
  disabledModules = [],
  className,
}: ModuleTabsProps) {
  return (
    <div
      className={cn(
        "flex w-max items-center gap-1 rounded-lg border p-1 transition-colors",
        "bg-[var(--ak-bg-main)]/50 border-[var(--ak-border-soft)]",
        className
      )}
    >
      {modules.map((mod) => {
        const isActive = activeModule === mod.id;
        const isDisabled = disabledModules.includes(mod.id);

        return (
          <button
            key={mod.id}
            type="button"
            onClick={() => {
              if (!isDisabled) {
                onModuleChange(mod.id)
              }
            }}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            className={cn(
              "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold whitespace-nowrap transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
              isActive
                ? "bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)] shadow-sm border-transparent"
                : "border-transparent text-[var(--ak-text-muted)] hover:bg-[var(--ak-bg-hover)] hover:text-[var(--ak-text-dim)]",
              isDisabled && "border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-[var(--ak-text-muted)] opacity-45 grayscale hover:bg-[var(--ak-bg-main)] hover:text-[var(--ak-text-muted)]"
            )}
          >
            <span
              className={cn(
                isActive
                  ? "text-[var(--ak-accent-foreground)]"
                  : "text-[var(--ak-text-muted)]"
              )}
            >
              {mod.icon}
            </span>
            {mod.label}
          </button>
        );
      })}
    </div>
  );
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
}

export function SearchOverlay({
  isOpen,
  onClose,
  appName = "Arbeidskassen",
}: SearchOverlayProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-2 pt-[10vh] backdrop-blur-sm animate-in fade-in duration-200 sm:px-4 sm:pt-[12vh]"
      onClick={onClose}
    >
      <div
        className={cn(
          "flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-2xl outline-none animate-in zoom-in-95 slide-in-from-top-[5%] duration-200",
          "bg-[var(--ak-bg-panel)] border-[var(--ak-border-soft)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "flex items-center gap-2 border-b px-3 py-3 sm:gap-3 sm:px-4 sm:py-4",
            "border-[var(--ak-border-soft)]"
          )}
        >
          <Search size={20} className="shrink-0 text-[var(--ak-text-muted)]" />
          <div className="hidden shrink-0 items-center gap-1.5 rounded-md border border-[var(--ak-border)] bg-[var(--ak-bg-main)] px-2 py-0.5 text-[11px] font-bold text-[var(--ak-text-muted)] transition-colors sm:flex">
            <LayoutGrid size={12} />
            {appName}
          </div>
          <input
            autoFocus
            type="text"
            placeholder={`Søk i ${appName} eller globalt...`}
            className="min-w-0 flex-1 border-none bg-transparent text-[16px] font-medium text-[var(--ak-text-main)] outline-none placeholder:text-[var(--ak-text-muted)]"
          />
          <div className="hidden shrink-0 items-center gap-1 rounded-md border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-2 py-1 text-[10px] font-bold text-[var(--ak-text-muted)] sm:flex">
            <span>ESC</span>
          </div>
        </div>
        <div className="overflow-y-auto bg-[var(--ak-bg-main)] p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ak-text-muted)]">
            Nylige søk
          </div>
          <div className="space-y-1">
            {[
              {
                icon: (
                  <CheckSquare size={16} className="text-[var(--ak-accent)]" />
                ),
                label: "Fakturere for Påskeegg",
                type: "Oppgave",
              },
              {
                icon: <Folder size={16} className="text-[#E5D08F]" />,
                label: "Design Team",
                type: "Mappe",
              },
              {
                icon: <MessageSquare size={16} className="text-[#10b981]" />,
                label: "Jan Helge Naley",
                type: "Chat",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--ak-bg-hover)]"
              >
                {item.icon}
                <span className="text-[13px] font-medium text-[var(--ak-text-main)]">
                  {item.label}
                </span>
                <span className="ml-auto text-[11px] text-[var(--ak-text-muted)]">
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface AppLauncherItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  href?: string;
  disabled?: boolean;
}

const defaultApps: AppLauncherItem[] = [
  {
    id: "teams",
    label: "Teams",
    icon: <Users size={22} strokeWidth={1.5} />,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    disabled: true,
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: <CalendarDays size={22} strokeWidth={1.5} />,
    color: "text-red-500",
    bg: "bg-red-500/10",
    disabled: true,
  },
  {
    id: "projects",
    label: "Projects",
    icon: <LayoutGrid size={22} strokeWidth={1.5} />,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    disabled: true,
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: <Zap size={22} strokeWidth={1.5} />,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    disabled: true,
  },
  {
    id: "crm",
    label: "CRM",
    icon: <User size={22} strokeWidth={1.5} />,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    disabled: true,
  },
  {
    id: "forms",
    label: "Forms",
    icon: <AlignJustify size={22} strokeWidth={1.5} />,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    disabled: true,
  },
];

export interface TenantOption {
  id: string;
  label: string;
  secondaryLabel?: string;
  isCurrent?: boolean;
}

const themeOptions = [
  {
    id: "light",
    label: "Lys",
    icon: <Sun size={14} className="text-[var(--ak-text-muted)]" />,
  },
  {
    id: "dark",
    label: "Mørk",
    icon: <Moon size={14} className="text-[var(--ak-text-muted)]" />,
  },
  {
    id: "night",
    label: "Natt",
    icon: <Star size={14} className="text-[var(--ak-text-muted)]" />,
  },
  {
    id: "system",
    label: "System",
    icon: <Monitor size={14} className="text-[var(--ak-text-muted)]" />,
  },
] as const;

type ThemeOptionId = (typeof themeOptions)[number]["id"];

function resolveThemePreference(value: string | undefined): ThemeOptionId {
  return value === "light" || value === "dark" || value === "night"
    ? value
    : "system";
}

type ProfileMenuProps = {
  locale?: string;
  orgName?: string;
  tenantOptions?: TenantOption[];
  userInitial?: string;
  profileHref?: string;
  organizationHref?: string;
  onTenantChange?: (formData: FormData) => void | Promise<void>;
  onThemeChange?: (formData: FormData) => void | Promise<void>;
  onSignOut?: (formData: FormData) => void | Promise<void>;
};

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

function ActionIconButton({
  className,
  type = "button",
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-md px-2 text-[var(--ak-text-muted)] transition-colors hover:bg-[var(--ak-bg-hover)] hover:text-[var(--ak-text-dim)] outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:min-w-9",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function AppLauncherContent({
  onAction,
  apps = defaultApps,
}: {
  onAction?: () => void;
  apps?: AppLauncherItem[];
}) {
  const hasEnabledApps = apps.some((app) => !app.disabled && app.href)

  return (
    <>
      <div className="mb-4 border-b border-[var(--ak-border-soft)] px-1 pb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ak-text-muted)]">
        Dine Verktøy og Apper
      </div>
      <div className="grid grid-cols-3 gap-3">
        {apps.map((app) => {
          const isDisabled = app.disabled || !app.href;

          return (
            <button
              key={app.id}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled) return
                if (app.href && typeof window !== "undefined") {
                  window.location.assign(app.href)
                }
                onAction?.()
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl p-3 text-center outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--ak-border)]",
                isDisabled
                  ? "cursor-not-allowed opacity-45 grayscale"
                  : "hover:scale-[1.02] hover:bg-[var(--ak-bg-hover)]"
              )}
            >
              <div
                className={cn(
                  "mb-2.5 flex h-12 w-12 items-center justify-center rounded-[14px]",
                  app.bg,
                  app.color
                )}
              >
                {app.icon}
              </div>
              <span className="text-[11.5px] font-semibold text-[var(--ak-text-main)]">{app.label}</span>
              <span className="mt-1 text-[10px] font-medium text-[var(--ak-text-muted)]">
                {isDisabled ? "Kommer snart" : "Åpne"}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex justify-center border-t border-[var(--ak-border-soft)] pt-3">
        <button
          type="button"
          disabled={!hasEnabledApps}
          onClick={onAction}
          className="rounded px-2 py-1 text-[12px] font-bold text-[var(--ak-accent)] transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--ak-border)] outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          Utforsk flere
        </button>
      </div>
    </>
  );
}

function AppLauncherPopover() {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <ActionIconButton aria-label="Apper">
          <Grip size={18} strokeWidth={2} />
        </ActionIconButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[100] w-[320px] max-w-[calc(100vw-1rem)] rounded-[20px] border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-4 text-[var(--ak-text-main)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <AppLauncherContent />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function ProfileMenu({
  locale = "no",
  orgName = "Workspace",
  tenantOptions = [],
  userInitial = "W",
  profileHref = "/profil",
  organizationHref = "/organisasjon",
  onTenantChange,
  onThemeChange,
  onSignOut,
}: ProfileMenuProps) {
  const { theme, setTheme } = useTheme();
  const [isThemePending, startThemeTransition] = React.useTransition();
  const themePreference = resolveThemePreference(theme);
  const hasTenantSwitcher =
    tenantOptions.length > 1 && typeof onTenantChange === "function";

  const handleThemePreferenceChange = (value: ThemeOptionId) => {
    setTheme(value);

    if (typeof onThemeChange !== "function") {
      return;
    }

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("themePreference", value);

    startThemeTransition(() => {
      void onThemeChange(formData);
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Åpne profilmeny"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ak-border)] bg-gradient-to-tr from-blue-500 to-indigo-600 text-[11px] font-bold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring md:h-8 md:w-8"
        >
          {userInitial}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[100] w-[280px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] text-[var(--ak-text-main)] shadow-[0_8px_30px_rgba(0,0,0,0.12)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-center gap-3 border-b border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-sm">
              <LayoutGrid size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold leading-tight">{orgName}</span>
              <span className="text-[11px] text-[var(--ak-text-muted)]">
                {hasTenantSwitcher
                  ? "Bytt tenant / workspace →"
                  : "Din aktive workspace"}
              </span>
            </div>
          </div>

          <div className="space-y-0.5 p-2">
            <DropdownMenu.Item asChild>
              <Link
                href={profileHref}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none"
              >
                <User size={14} className="text-[var(--ak-text-muted)]" /> Min profil
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href={organizationHref}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none"
              >
                <Building2 size={14} className="text-[var(--ak-text-muted)]" /> Organisasjon
              </Link>
            </DropdownMenu.Item>

            {hasTenantSwitcher ? (
              <>
                <DropdownMenu.Separator className="my-1 h-px bg-[var(--ak-border-soft)]" />
                <div className="px-2 py-1">
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ak-text-muted)]">
                    Workspaces
                  </div>
                  <div className="space-y-1">
                    {tenantOptions.map((tenant) => (
                      <form key={tenant.id} action={onTenantChange}>
                        <input type="hidden" name="tenantId" value={tenant.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)]"
                        >
                          <div className="flex flex-col">
                            <span>{tenant.label}</span>
                            {tenant.secondaryLabel ? (
                              <span className="text-[11px] text-[var(--ak-text-muted)]">
                                {tenant.secondaryLabel}
                              </span>
                            ) : null}
                          </div>
                          {tenant.isCurrent ? (
                            <Check size={14} className="text-[var(--ak-accent)]" />
                          ) : null}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <DropdownMenu.Separator className="my-1 h-px bg-[var(--ak-border-soft)]" />

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none data-[state=open]:bg-[var(--ak-bg-hover)]">
                <div className="flex items-center gap-2.5">
                  <Sun size={14} className="text-[var(--ak-text-muted)]" /> Tema
                </div>
                <ChevronRight size={14} className="text-[var(--ak-text-muted)]" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  sideOffset={8}
                  className="w-48 rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-1 text-[var(--ak-text-main)] shadow-lg outline-none animate-in fade-in-0 zoom-in-95"
                >
                  <DropdownMenu.Item
                    disabled={isThemePending}
                    onClick={() => handleThemePreferenceChange("light")}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none data-[disabled]:cursor-wait data-[disabled]:opacity-60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sun size={14} className="text-[var(--ak-text-muted)]" /> Lys
                    </div>
                    {themePreference === "light" ? (
                      <Check size={14} className="text-[var(--ak-accent)]" />
                    ) : null}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    disabled={isThemePending}
                    onClick={() => handleThemePreferenceChange("dark")}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none data-[disabled]:cursor-wait data-[disabled]:opacity-60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Moon size={14} className="text-[var(--ak-text-muted)]" /> Mørk
                    </div>
                    {themePreference === "dark" ? (
                      <Check size={14} className="text-[var(--ak-accent)]" />
                    ) : null}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    disabled={isThemePending}
                    onClick={() => handleThemePreferenceChange("night")}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none data-[disabled]:cursor-wait data-[disabled]:opacity-60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Star size={14} className="text-[var(--ak-text-muted)]" /> Natt
                    </div>
                    {themePreference === "night" ? (
                      <Check size={14} className="text-[var(--ak-accent)]" />
                    ) : null}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px bg-[var(--ak-border-soft)]" />
                  <DropdownMenu.Item
                    disabled={isThemePending}
                    onClick={() => handleThemePreferenceChange("system")}
                    className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none data-[disabled]:cursor-wait data-[disabled]:opacity-60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Monitor size={14} className="text-[var(--ak-text-muted)]" /> System
                    </div>
                    {themePreference === "system" ? (
                      <Check size={14} className="text-[var(--ak-accent)]" />
                    ) : null}
                  </DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none data-[state=open]:bg-[var(--ak-bg-hover)]">
                <div className="flex items-center gap-2.5">
                  <Globe size={14} className="text-[var(--ak-text-muted)]" /> Språk
                </div>
                <ChevronRight size={14} className="text-[var(--ak-text-muted)]" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  sideOffset={8}
                  className="w-48 rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] p-1 text-[var(--ak-text-main)] shadow-lg outline-none animate-in fade-in-0 zoom-in-95"
                >
                  <DropdownMenu.Item className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none">
                    Norsk Bokmål
                    <Check size={14} className="text-[var(--ak-accent)]" />
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="flex w-full cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--ak-bg-hover)] focus:bg-[var(--ak-bg-hover)] outline-none">
                    English
                  </DropdownMenu.Item>
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>

            <DropdownMenu.Separator className="my-1 h-px bg-[var(--ak-border-soft)]" />

            {onSignOut ? (
              <form action={onSignOut}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-red-500 transition-colors hover:bg-[var(--ak-bg-hover)] hover:text-red-600"
                >
                  <LogOut size={14} /> Logg ut
                </button>
              </form>
            ) : null}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

type MobileNavDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appName: string;
  locale: string;
  orgName: string;
  modules: ModuleTab[];
  activeModule: string;
  onModuleChange: (id: string) => void;
  disabledModules?: string[];
  tenantOptions?: TenantOption[];
  userInitial: string;
  profileHref?: string;
  organizationHref?: string;
  onTenantChange?: (formData: FormData) => void | Promise<void>;
  onThemeChange?: (formData: FormData) => void | Promise<void>;
  onSignOut?: (formData: FormData) => void | Promise<void>;
  onSearchOpen: () => void;
};

function MobileNavDrawer({
  isOpen,
  onOpenChange,
  appName,
  locale,
  orgName,
  modules,
  activeModule,
  onModuleChange,
  disabledModules = [],
  tenantOptions = [],
  userInitial,
  profileHref = "/profil",
  organizationHref = "/organisasjon",
  onTenantChange,
  onThemeChange,
  onSignOut,
  onSearchOpen,
}: MobileNavDrawerProps) {
  const { theme, setTheme } = useTheme();
  const [isThemePending, startThemeTransition] = React.useTransition();
  const themePreference = resolveThemePreference(theme);
  const hasTenantSwitcher =
    tenantOptions.length > 1 && typeof onTenantChange === "function";

  const handleThemePreferenceChange = (value: ThemeOptionId) => {
    setTheme(value);

    if (typeof onThemeChange !== "function") {
      return;
    }

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("themePreference", value);

    startThemeTransition(() => {
      void onThemeChange(formData);
    });
  };

  const handleModuleSelect = (id: string) => {
    onModuleChange(id);
    onOpenChange(false);
  };

  const handleSearch = () => {
    onOpenChange(false);
    onSearchOpen();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0">
        <SheetHeader className="border-b border-[var(--ak-border-soft)] px-4 py-4 pr-14">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] shadow-sm">
              <LayoutGrid size={16} className="text-[var(--ak-text-muted)]" />
            </div>
            <div className="min-w-0 text-left">
              <SheetTitle className="truncate text-[15px] text-[var(--ak-text-main)]">
                {appName}
              </SheetTitle>
              <p className="truncate text-[12px] text-[var(--ak-text-muted)]">
                {orgName}
              </p>
            </div>
            <div className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-[11px] font-bold text-white">
              {userInitial}
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-[var(--ak-border-soft)] p-3">
            <button
              type="button"
              onClick={handleSearch}
              className="flex h-11 w-full items-center gap-3 rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-3 text-left text-[13px] font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)] focus-visible:ring-2 focus-visible:ring-ring outline-none"
            >
              <Search size={17} className="text-[var(--ak-text-muted)]" />
              <span>Søk i {appName}</span>
              <span className="ml-auto rounded border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ak-text-muted)]">
                ⌘K
              </span>
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-3">
            <section>
              <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ak-text-muted)]">
                Moduler
              </div>
              <div className="space-y-1.5">
                {modules.map((mod) => {
                  const isActive = activeModule === mod.id;
                  const isDisabled = disabledModules.includes(mod.id);

                  return (
                    <button
                      key={mod.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleModuleSelect(mod.id)}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
                        isActive
                          ? "border-[var(--ak-border)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)]"
                          : "border-transparent text-[var(--ak-text-muted)] hover:bg-[var(--ak-bg-hover)] hover:text-[var(--ak-text-dim)]",
                        isDisabled && "border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] text-[var(--ak-text-muted)] opacity-45 grayscale hover:bg-[var(--ak-bg-main)] hover:text-[var(--ak-text-muted)]"
                      )}
                    >
                      <span
                        className={cn(
                          isActive
                            ? "text-[var(--ak-accent)]"
                            : "text-[var(--ak-text-muted)]"
                        )}
                      >
                        {mod.icon}
                      </span>
                      <span>{mod.label}</span>
                      {isActive ? (
                        <Check size={14} className="ml-auto text-[var(--ak-accent)]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ak-text-muted)]">
                Hurtighandlinger
              </div>
              <button
                type="button"
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)] focus-visible:ring-2 focus-visible:ring-ring outline-none"
              >
                <Bell size={16} className="text-[var(--ak-text-muted)]" />
                Varsler
                <span className="ml-auto rounded-full bg-[var(--ak-accent)]/10 px-2 py-0.5 text-[11px] font-bold text-[var(--ak-accent)]">
                  3 nye
                </span>
              </button>
            </section>

            <section className="rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] p-3">
              <AppLauncherContent onAction={() => onOpenChange(false)} />
            </section>

            <section>
              <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ak-text-muted)]">
                Tema
              </div>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((option) => {
                  const isActive = themePreference === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleThemePreferenceChange(option.id)}
                      disabled={isThemePending}
                      className={cn(
                        "flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "border-[var(--ak-border)] bg-[var(--ak-bg-card)] text-[var(--ak-text-main)]"
                          : "border-[var(--ak-border-soft)] text-[var(--ak-text-muted)] hover:bg-[var(--ak-bg-hover)]"
                      )}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {hasTenantSwitcher ? (
              <section>
                <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--ak-text-muted)]">
                  Workspaces
                </div>
                <div className="space-y-1.5">
                  {tenantOptions.map((tenant) => (
                    <form key={tenant.id} action={onTenantChange}>
                      <input type="hidden" name="tenantId" value={tenant.id} />
                      <input type="hidden" name="locale" value={locale} />
                      <button
                        type="submit"
                        className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)] focus-visible:ring-2 focus-visible:ring-ring outline-none"
                      >
                        <div className="flex flex-col">
                          <span>{tenant.label}</span>
                          {tenant.secondaryLabel ? (
                            <span className="text-[11px] text-[var(--ak-text-muted)]">
                              {tenant.secondaryLabel}
                            </span>
                          ) : null}
                        </div>
                        {tenant.isCurrent ? (
                          <Check size={14} className="text-[var(--ak-accent)]" />
                        ) : null}
                      </button>
                    </form>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-[var(--ak-border-soft)] p-3">
            <div className="flex items-center justify-between rounded-xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] px-2.5 py-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-[11px] font-bold text-white">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[var(--ak-text-main)]">
                    {orgName}
                  </p>
                  <p className="truncate text-[11px] text-[var(--ak-text-muted)]">
                    Profil og organisasjon
                  </p>
                </div>
              </div>
              <ProfileMenu
                locale={locale}
                orgName={orgName}
                tenantOptions={tenantOptions}
                userInitial={userInitial}
                profileHref={profileHref}
                organizationHref={organizationHref}
                onTenantChange={onTenantChange}
                onThemeChange={onThemeChange}
                onSignOut={onSignOut}
              />
            </div>

            {onSignOut ? (
              <form action={onSignOut}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-ring outline-none"
                >
                  <LogOut size={15} /> Logg ut
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export interface NavbarProps {
  appName?: string;
  workspaceName?: string;
  workspaceInitial?: string;
  locale?: string;
  orgName?: string;
  modules?: ModuleTab[];
  tenantOptions?: TenantOption[];
  userInitial?: string;
  profileHref?: string;
  organizationHref?: string;
  moduleHrefs?: Partial<Record<string, string>>;
  disabledModules?: string[];
  onTenantChange?: (formData: FormData) => void | Promise<void>;
  onThemeChange?: (formData: FormData) => void | Promise<void>;
  onSignOut?: (formData: FormData) => void | Promise<void>;
  activeModule: string;
  onModuleChange: (id: string) => void;
}

export function Navbar({
  appName = "Arbeidskassen",
  workspaceName: _workspaceName = "Workspace",
  workspaceInitial = "W",
  locale = "no",
  orgName = "Workspace",
  modules,
  tenantOptions = [],
  userInitial = workspaceInitial,
  profileHref = "/profil",
  organizationHref = "/organisasjon",
  moduleHrefs,
  disabledModules = [],
  onTenantChange,
  onThemeChange,
  onSignOut,
  activeModule,
  onModuleChange,
}: NavbarProps) {
  const resolvedModules = modules ?? defaultModules;
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsMobileNavOpen(false);
        setIsSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [activeModule]);

  const openSearch = () => {
    setIsMobileNavOpen(false);
    setIsSearchOpen(true);
  };

  const handleModuleChange = (id: string) => {
    if (disabledModules.includes(id)) {
      return;
    }

    onModuleChange(id);

    const href = moduleHrefs?.[id]
    if (!href) {
      return
    }

    if (href.startsWith("http://") || href.startsWith("https://")) {
      window.location.assign(href)
    } else {
      router.push(href)
    }
  }

  return (
    <>
      <nav className="z-[60] w-full flex-shrink-0 border-b border-[var(--ak-border-soft)] bg-[var(--ak-bg-panel)] transition-colors duration-300">
        <div className="flex h-12 w-full items-center gap-2 px-3 sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-[var(--ak-border-soft)] bg-[var(--ak-bg-main)] shadow-sm">
              <LayoutGrid size={13} className="text-[var(--ak-text-muted)]" />
            </div>
            <span className="truncate text-[14px] font-bold tracking-tight text-[var(--ak-text-main)]">
              {appName}
            </span>
          </div>

          <div className="hidden flex-1 justify-center px-4 md:flex">
            <div className="flex w-full justify-center overflow-x-auto [scrollbar-width:none]">
              <ModuleTabs
                modules={resolvedModules}
                activeModule={activeModule}
                onModuleChange={handleModuleChange}
                disabledModules={disabledModules}
                className="mx-auto"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2 md:gap-3">
            <ActionIconButton
              aria-label="Søk (CMD+K)"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="px-2 sm:px-2.5"
            >
              <Search size={18} strokeWidth={2} />
              <span className="hidden rounded border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-1.5 py-0.5 text-[10px] font-bold lg:inline-flex">
                ⌘K
              </span>
            </ActionIconButton>

            <div
              className="hidden items-center gap-1 rounded border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] px-2 py-1 text-[10px] font-bold text-[var(--ak-text-muted)] lg:inline-flex"
              title="Åpne dashboard-overlay med D + 1-9"
            >
              <LayoutGrid size={12} strokeWidth={2} />
              D + 1-9
            </div>

            <AppLauncherPopover />

            <ActionIconButton aria-label="Varsler" className="relative">
              <Bell size={18} strokeWidth={1.5} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[var(--ak-bg-panel)] bg-red-500" />
            </ActionIconButton>

            <div className="hidden sm:block">
              <ProfileMenu
                locale={locale}
                orgName={orgName}
                tenantOptions={tenantOptions}
                userInitial={userInitial}
                profileHref={profileHref}
                organizationHref={organizationHref}
                onTenantChange={onTenantChange}
                onThemeChange={onThemeChange}
                onSignOut={onSignOut}
              />
            </div>

            <ActionIconButton
              aria-label="Åpne navigasjon"
              onClick={() => setIsMobileNavOpen(true)}
              className="sm:hidden"
            >
              <AlignJustify size={18} strokeWidth={2} />
            </ActionIconButton>
          </div>
        </div>

        <div className="hidden border-t border-[var(--ak-border-soft)] px-3 py-2 sm:block md:hidden">
          <div className="overflow-x-auto [scrollbar-width:none]">
            <ModuleTabs
              modules={resolvedModules}
              activeModule={activeModule}
              onModuleChange={handleModuleChange}
              disabledModules={disabledModules}
              className="min-w-max"
            />
          </div>
        </div>
      </nav>

      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onOpenChange={setIsMobileNavOpen}
        appName={appName}
        locale={locale}
        orgName={orgName}
        modules={resolvedModules}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        disabledModules={disabledModules}
        tenantOptions={tenantOptions}
        userInitial={userInitial}
        profileHref={profileHref}
        organizationHref={organizationHref}
        onTenantChange={onTenantChange}
        onThemeChange={onThemeChange}
        onSignOut={onSignOut}
        onSearchOpen={openSearch}
      />

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        appName={appName}
      />
    </>
  );
}
