import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "./routing";

/** Map each module's URL prefix to its namespace file. */
const MODULE_NAMESPACE_MAP: Record<string, string> = {
  "/bookdet": "bookdet",
  "/teamarea": "teamarea",
  "/today": "today",
};

function resolveModuleNamespace(pathname: string): string | null {
  for (const [prefix, namespace] of Object.entries(MODULE_NAMESPACE_MAP)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return namespace;
    }
  }
  return null;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  // Read the pathname set by middleware so we only load the relevant module
  // namespace instead of all namespaces on every request.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const moduleNamespace = resolveModuleNamespace(pathname);

  const [common, moduleMessages] = await Promise.all([
    import(`../messages/${locale}/common.json`).then((m) => m.default),
    moduleNamespace
      ? import(`../messages/${locale}/${moduleNamespace}.json`).then(
          (m) => m.default,
        )
      : Promise.resolve({}),
  ]);

  return {
    locale,
    messages: { ...common, ...moduleMessages },
  };
});
