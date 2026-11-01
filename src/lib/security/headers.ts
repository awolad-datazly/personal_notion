/** CSP tuned for Next.js + Google OAuth avatars + YouTube Vault embeds. */
export function buildContentSecurityPolicy(isDev: boolean) {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://s.ytimg.com",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://i.ytimg.com https://*.googleusercontent.com https://*.ggpht.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
] as const;
