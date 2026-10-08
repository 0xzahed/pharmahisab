import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* PharmaHisab is a live dashboard — every API response must be fresh. */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
