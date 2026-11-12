# Personal Notion (DevHub)

Distraction-free personal tech hub: auth-gated modules, Video Vault, News Radar, and BYOK Gemini summaries.

Stack: **Next.js 16** (App Router, Cache Components), **React 19**, **Auth.js (Google)**, **Drizzle + Supabase Postgres**, **Tailwind v4**, **pnpm**.

## Local development

```bash
pnpm install
cp .env.example .env.local
# fill DATABASE_URL, DIRECT_URL, AUTH_SECRET, Google OAuth, AUTH_ADMIN_EMAIL
pnpm db:migrate
pnpm dev
```

Sign in from the header with Google. The redirect URI is `{AUTH_URL}/api/auth/callback/google`.

Scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm db:studio`.

## Vercel + Supabase

1. In Supabase, copy the **transaction pooler** URI (port 6543) into Vercel as `DATABASE_URL`.
2. Copy the **direct** URI (port 5432) into `.env.local` as `DIRECT_URL`, then run `pnpm db:migrate` once from your machine.
3. In Google Cloud, create an OAuth client and set the redirect URI to `https://<your-vercel-domain>/api/auth/callback/google`.
4. In Vercel project settings, set:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler URI |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://<your-vercel-domain>` (no trailing slash) |
| `AUTH_GOOGLE_ID` | Google client id |
| `AUTH_GOOGLE_SECRET` | Google client secret |
| `AUTH_ADMIN_EMAIL` | The Google account that should be admin |

`AUTH_TRUST_HOST` is already enabled in the app. Preview deployments use a different host, so Google sign-in works on the production domain you registered.

## Docker

Multi-stage image (`standalone` output), non-root user, read-only rootfs, healthcheck on `/api/health`.

```bash
cp .env.docker.example .env.docker
# fill secrets in .env.docker

pnpm docker:migrate   # apply Drizzle migrations
pnpm docker:up        # build + run app on :3000
pnpm docker:down
```

Or:

```bash
docker build -t personal-notion:local .
docker compose up --build -d
```

Runtime secrets are injected via `.env.docker` — they are **not** baked into the image.

## CI / CD

| Workflow | Purpose |
| --- | --- |
| `CI` | lint, typecheck, production build |
| `Docker` | build image, Trivy scan, push to `ghcr.io/<owner>/<repo>` on `main` / tags |
| `Security` | Gitleaks, `pnpm audit`, CodeQL |
| Dependabot | weekly npm, Actions, and Docker base updates |

GHCR packages are private to the repo by default; grant `read:packages` to pull on a host.

## Security

See [SECURITY.md](./SECURITY.md) for the control matrix, secret handling, and deploy checklist.

Production boot validates required env vars (`src/instrumentation.ts`). CSP, HSTS, frame denial, and Server Action origin checks are enabled in `next.config.ts` / `src/proxy.ts`.
