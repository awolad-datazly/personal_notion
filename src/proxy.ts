import { NextResponse, type NextRequest } from "next/server";

import { buildContentSecurityPolicy } from "@/lib/security/headers";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId =
    request.headers.get("x-request-id") ?? crypto.randomUUID();

  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-request-id", requestId);
  response.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(process.env.NODE_ENV === "development"),
  );

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
