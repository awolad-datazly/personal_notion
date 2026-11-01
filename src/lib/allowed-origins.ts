/** Normalize AUTH_URL / ALLOWED_ORIGINS entries to `host[:port]` for Server Actions. */
export function toActionOriginHost(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    );
    if (!url.hostname) {
      return null;
    }

    return url.port ? `${url.hostname}:${url.port}` : url.hostname;
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/\/.*$/, "") || null;
  }
}

export function allowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const raw =
    env.ALLOWED_ORIGINS ?? env.AUTH_URL ?? env.NEXTAUTH_URL ?? "";

  const hosts = raw
    .split(",")
    .map((value) => toActionOriginHost(value))
    .filter((value): value is string => Boolean(value));

  return [...new Set(hosts)];
}
