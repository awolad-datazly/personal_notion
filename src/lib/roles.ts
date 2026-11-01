import "server-only";

import type { UserRole } from "@/db/schema";

export function roleForEmail(
  email: string | null | undefined,
  adminEmail = process.env.AUTH_ADMIN_EMAIL,
): UserRole {
  const admin = adminEmail?.trim().toLowerCase();
  const candidate = email?.trim().toLowerCase();

  if (!admin || !candidate) {
    return "USER";
  }

  return candidate === admin ? "ADMIN" : "USER";
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}
