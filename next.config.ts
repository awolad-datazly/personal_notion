import type { NextConfig } from "next";

import { allowedOrigins } from "./src/lib/allowed-origins";
import {
  buildContentSecurityPolicy,
  SECURITY_HEADERS,
} from "./src/lib/security/headers";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Docker builds a standalone server. Vercel uses its own output.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  poweredByHeader: false,
  experimental: {
    agentFeedback: true,
    serverActions: {
      bodySizeLimit: "1mb",
      // Only set when provided at build time. Same-origin Host/Origin matching
      // covers normal deploys; use ALLOWED_ORIGINS when a reverse proxy rewrites Host.
      ...(allowedOrigins().length > 0
        ? { allowedOrigins: allowedOrigins() }
        : {}),
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...SECURITY_HEADERS,
          {
            key: "Content-Security-Policy",
            value: buildContentSecurityPolicy(isDev),
          },
          ...(isDev
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]),
        ],
      },
    ];
  },
};

export default nextConfig;
