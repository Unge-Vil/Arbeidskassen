import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@arbeidskassen/ui", "@arbeidskassen/supabase"],
};

export default withNextIntl(nextConfig);
