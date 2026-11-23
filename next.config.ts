import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Directory-style export (bn/convert/index.html) so static hosts like
  // Netlify serve every page natively without redirect rules.
  trailingSlash: true,
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
