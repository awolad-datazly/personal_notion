# Security

## Reporting a vulnerability

Email the project maintainer privately. Do not open a public issue for active exploits or leaked credentials.

## Threat model (short)

Personal Notion is a **single-admin / small-team** hub. The main risks are:

- Account takeover via OAuth misconfiguration
- Session fixation / multi-device session sharing (mitigated: one DB session per user)
- Abuse of the BYOK Gemini summarize API
- XSS via third-party embeds (YouTube)
- Secrets leaking into images, logs, or CI artifacts

## Controls in this repo

| Control | Where |
| --- | --- |
| Database sessions + single-session enforcement | `src/auth.ts` |
| Google email verified required | `src/auth.ts` `signIn` callback |
| Admin role gated by `AUTH_ADMIN_EMAIL` | `src/lib/roles.ts` |
| Feature flags gate modules | `src/lib/feature-flags/*` |
| Security headers + CSP | `next.config.ts`, `src/lib/security/headers.ts`, `src/proxy.ts` |
| Server Actions origin allow-list | `ALLOWED_ORIGINS` / `AUTH_URL` |
| AI summarize rate limit | `src/app/api/ai/summarize/route.ts` |
| Production env validation on boot | `src/instrumentation.ts` |
| Non-root, read-only Docker runtime | `Dockerfile`, `compose.yaml` |
| CI lint/typecheck/build | `.github/workflows/ci.yml` |
| Image build + Trivy | `.github/workflows/docker.yml` |
| Gitleaks, pnpm audit, CodeQL | `.github/workflows/security.yml` |
| Dependabot | `.github/dependabot.yml` |

## Secrets checklist

- Never commit `.env`, `.env.local`, or `.env.docker`
- Generate `AUTH_SECRET` with `openssl rand -base64 32`
- Restrict Google OAuth client to your exact `AUTH_URL` redirect URI
- Use the Supabase transaction pooler URL with TLS (`sslmode=require`) for `DATABASE_URL`
- Rotate Google client secret and Auth secret if either leaks
- Gemini keys stay in the browser (`x-gemini-key`); they are never stored server-side

## Deploy notes

1. Copy `.env.docker.example` → `.env.docker` and fill real values
2. `pnpm docker:migrate` (or `docker compose --profile migrate run --rm migrate`)
3. `pnpm docker:up`
4. Put TLS termination in front (Caddy/nginx/Traefik). HSTS is enabled in production responses.

Set `SKIP_ENV_VALIDATION=1` only for intentional CI smoke builds—never in real deployments.
