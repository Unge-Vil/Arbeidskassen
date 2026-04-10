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
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f5] px-4">
        <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-[#1a1f2e]">Ingen aktive workspaces</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kontoen din er logget inn, men mangler et aktivt tenant-medlemskap.
            Kontakt en administrator for tilgang.
          </p>

          <form action={signOutAction} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
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
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f5] px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-md">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1a1f2e]">
            Velg workspace
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Kontoen din er knyttet til flere tenants. Velg hvor du vil jobbe nå.
          </p>
        </div>

        {params?.error ? (
          <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
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
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-[#1a1f2e]">{tenantName}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      Rolle: {formatRole(membership.role)} · Plan: {membership.tenant.plan}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700"
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
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Logg ut
          </button>
        </form>
      </div>
    </div>
  );
}
