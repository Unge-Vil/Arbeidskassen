import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { routing } from "./routing";

const NEXT_LOCALE_COOKIE = "NEXT_LOCALE";

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
  // Resolve locale: middleware hint → NEXT_LOCALE cookie → default
  let locale = await requestLocale;

  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(NEXT_LOCALE_COOKIE)?.value;
    locale =
      cookieLocale &&
      routing.locales.includes(cookieLocale as (typeof routing.locales)[number])
        ? cookieLocale
        : routing.defaultLocale;
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
