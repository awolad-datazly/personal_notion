import "server-only";

import { allowedOrigins } from "@/lib/allowed-origins";

export { allowedOrigins };

type EnvIssue = {
  key: string;
  message: string;
};

function missing(key: string): EnvIssue {
  return { key, message: `${key} is required` };
}

/** Validates runtime secrets once the Node server is up. */
export function collectEnvIssues(
  env: NodeJS.ProcessEnv = process.env,
): EnvIssue[] {
  const issues: EnvIssue[] = [];

  if (!env.DATABASE_URL?.trim()) {
    issues.push(missing("DATABASE_URL"));
  }

  const authSecret = env.AUTH_SECRET?.trim() ?? "";
  if (
    authSecret.length < 32 ||
    authSecret === "build-time-only-not-for-runtime"
  ) {
    issues.push({
      key: "AUTH_SECRET",
      message: "AUTH_SECRET must be a real secret (openssl rand -base64 32)",
    });
  }

  if (!env.AUTH_GOOGLE_ID?.trim() || env.AUTH_GOOGLE_ID === "build") {
    issues.push(missing("AUTH_GOOGLE_ID"));
  }

  if (!env.AUTH_GOOGLE_SECRET?.trim() || env.AUTH_GOOGLE_SECRET === "build") {
    issues.push(missing("AUTH_GOOGLE_SECRET"));
  }

  if (!env.AUTH_ADMIN_EMAIL?.trim()) {
    issues.push(missing("AUTH_ADMIN_EMAIL"));
  }

  return issues;
}

export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  // Allow image builds / CI smoke builds with placeholders.
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return;
  }

  const issues = collectEnvIssues();

  if (issues.length === 0) {
    return;
  }

  const detail = issues.map((issue) => `- ${issue.message}`).join("\n");
  throw new Error(`Invalid production environment:\n${detail}`);
}
