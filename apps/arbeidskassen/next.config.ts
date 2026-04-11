import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const proxiedApps = [
  {
    slug: "today",
    destination: process.env.TODAY_APP_URL ?? process.env.NEXT_PUBLIC_TODAY_APP_URL,
  },
  {
    slug: "bookdet",
    destination: process.env.BOOKDET_APP_URL ?? process.env.NEXT_PUBLIC_BOOKDET_APP_URL,
  },
  {
    slug: "organisasjon",
    destination:
      process.env.ORGANISASJON_APP_URL ??
      process.env.ORGANIZATION_APP_URL ??
      process.env.NEXT_PUBLIC_ORGANISASJON_URL ??
      process.env.NEXT_PUBLIC_ORGANIZATION_APP_URL,
  },
  {
    slug: "teamarea",
    destination: process.env.TEAMAREA_APP_URL ?? process.env.NEXT_PUBLIC_TEAMAREA_APP_URL,
  },
  {
    slug: "backoffice",
    destination: process.env.BACKOFFICE_APP_URL ?? process.env.NEXT_PUBLIC_BACKOFFICE_APP_URL,
  },
  {
    slug: "sales-portal",
    destination: process.env.SALES_PORTAL_APP_URL ?? process.env.NEXT_PUBLIC_SALES_PORTAL_APP_URL,
  },
] as const;

const legacyAppMatcher = "today|bookdet|organisasjon|teamarea|backoffice|sales-portal";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  transpilePackages: ["@arbeidskassen/ui", "@arbeidskassen/supabase"],
  async redirects() {
    return [
      {
        source: `/:app(${legacyAppMatcher})/:locale(no|en)/:path*`,
        destination: "/:locale/:app/:path*",
        permanent: false,
      },
      {
        source: `/:app(${legacyAppMatcher})/:path*`,
        destination: "/no/:app/:path*",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const externalProxyRewrites = proxiedApps.flatMap((app) => {
      if (typeof app.destination !== "string" || !/^https?:\/\//.test(app.destination)) {
        return [];
      }

      return [
        {
          source: `/:locale(no|en)/${app.slug}/:path*`,
          destination: `${app.destination.replace(/\/$/, "")}/:locale/:path*`,
        },
      ];
    });

    return {
      beforeFiles: externalProxyRewrites,
      afterFiles: [],
      fallback: [],
    };
  },
};

export default withNextIntl(nextConfig);
