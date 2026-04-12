import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  transpilePackages: ["@arbeidskassen/ui", "@arbeidskassen/supabase"],
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // Only upload source maps when SENTRY_AUTH_TOKEN is set (i.e. production deploys)
  silent: !process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
