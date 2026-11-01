# Personal Notion (DevHub)

Distraction-free personal tech hub: auth-gated modules, Video Vault, News Radar, and BYOK Gemini summaries.

Stack: **Next.js 16** (App Router, Cache Components), **React 19**, **Auth.js**, **Drizzle + Neon**, **Tailwind v4**, **pnpm**.

## Local development

```bash
pnpm install
cp .env.example .env.local
# fill DATABASE_URL, AUTH_SECRET, Google OAuth, AUTH_ADMIN_EMAIL
pnpm db:migrate
pnpm dev
```

Scripts: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm db:studio`.

Google OAuth redirect: `{AUTH_URL}/api/auth/callback/google`.

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
