import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@arbeidskassen/ui", "@arbeidskassen/supabase"],
};

export default nextConfig;
