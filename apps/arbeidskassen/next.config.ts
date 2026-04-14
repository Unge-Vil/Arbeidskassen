import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  transpilePackages: ["@arbeidskassen/ui", "@arbeidskassen/supabase"],
  experimental: {
    optimizePackageImports: [
      "@arbeidskassen/ui",
      "@radix-ui/react-avatar",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "class-variance-authority",
      "lucide-react",
      "react-hook-form",
      "sonner",
    ],
  },
};

export default withSentryConfig(withNextIntl(withAnalyzer(nextConfig)), {
  // Only upload source maps when SENTRY_AUTH_TOKEN is set (i.e. production deploys)
  silent: !process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Disable Sentry wrapping of middleware to reduce Edge bundle size (~149kB → ~50kB).
  // Errors in middleware are still caught by the Edge error handler in instrumentation.ts.
  autoInstrumentMiddleware: false,
});
