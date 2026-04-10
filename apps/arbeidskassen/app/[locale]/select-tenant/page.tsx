import { redirect } from "next/navigation";
import { getTenantContext, type TenantRole } from "@arbeidskassen/supabase";
import { signOutAction, switchTenantAction } from "../../actions/auth";

type SelectTenantPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function formatRole(role: TenantRole): string {
  switch (role) {
    case "owner":
      return "Eier";
    case "admin":
      return "Admin";
    case "member":
      return "Medlem";
    default:
      return "Lesetilgang";
  }
}

export default async function SelectTenantPage({
  searchParams,
}: SelectTenantPageProps) {
  const context = await getTenantContext();

  if (!context?.user) {
    redirect("/login");
  }

  if (context.memberships.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ak-bg-main)] px-4">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-6 shadow-sm">
          <h1 className="text-xl font-bold text-[var(--ak-text-main)]">Ingen aktive workspaces</h1>
          <p className="mt-2 text-sm text-[var(--ak-text-muted)]">
            Kontoen din er logget inn, men mangler et aktivt tenant-medlemskap.
            Kontakt en administrator for tilgang.
          </p>

          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-[var(--ak-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)]"
            >
              Logg ut
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (context.memberships.length === 1) {
    redirect("/dashboard");
  }

  const params = await Promise.resolve(searchParams);
  const currentTenantId = context.currentTenant?.id ?? null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--ak-bg-main)] px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ak-accent)] text-xl font-bold text-[var(--ak-accent-foreground)] shadow-md">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ak-text-main)]">
            Velg workspace
          </h1>
          <p className="mt-2 text-sm text-[var(--ak-text-muted)]">
            Kontoen din er knyttet til flere tenants. Velg hvor du vil jobbe nå.
          </p>
        </div>

        {params?.error ? (
          <div className="mb-4 rounded-lg border border-[var(--ak-status-stuck)] bg-[var(--ak-status-stuck-bg)] text-[var(--ak-status-stuck)]">
            {decodeURIComponent(params.error)}
          </div>
        ) : null}

        <div className="space-y-3">
          {context.memberships.map((membership) => {
            const tenantName = membership.tenant.display_name ?? membership.tenant.name;
            const isCurrent = membership.tenant.id === currentTenantId;

            return (
              <form key={membership.tenant.id} action={switchTenantAction}>
                <input type="hidden" name="tenantId" value={membership.tenant.id} />
                <button
                  type="submit"
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    isCurrent
                      ? "border-[var(--ak-accent)] bg-[var(--ak-bg-hover)] ring-1 ring-[var(--ak-accent)]"
                      : "border-[var(--ak-border-soft)] bg-[var(--ak-bg-card)] hover:border-[var(--ak-accent)] hover:bg-[var(--ak-bg-hover)]"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-[var(--ak-text-main)]">{tenantName}</div>
                    <div className="mt-1 text-xs text-[var(--ak-text-muted)]">
                      Rolle: {formatRole(membership.role)} · Plan: {membership.tenant.plan}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isCurrent
                        ? "bg-[var(--ak-accent)] text-[var(--ak-accent-foreground)]"
                        : "bg-[var(--ak-bg-hover)] border border-[var(--ak-border-soft)] text-[var(--ak-text-dim)]"
                    }`}
                  >
                    {isCurrent ? "Aktiv" : "Velg"}
                  </span>
                </button>
              </form>
            );
          })}
        </div>

        <form action={signOutAction} className="mt-6 flex justify-center">
          <button
            type="submit"
            className="rounded-lg border border-[var(--ak-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--ak-text-main)] transition-colors hover:bg-[var(--ak-bg-hover)]"
          >
            Logg ut
          </button>
        </form>
      </div>
    </div>
  );
}
