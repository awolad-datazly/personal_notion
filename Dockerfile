# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.13.0-slim

# --------------------------------------------
# Dependencies
# --------------------------------------------
FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  corepack enable pnpm \
  && pnpm install --frozen-lockfile

# --------------------------------------------
# Build
# --------------------------------------------
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Placeholder values so `next build` can evaluate server modules.
# Real secrets are injected at runtime via Compose / orchestrator.
ENV AUTH_SECRET=build-time-only-not-for-runtime
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV AUTH_GOOGLE_ID=build
ENV AUTH_GOOGLE_SECRET=build
ENV AUTH_ADMIN_EMAIL=build@example.com

# Optional CSRF allow-list baked at build time (host or URL). Leave empty for same-origin only.
ARG ALLOWED_ORIGINS=
ENV ALLOWED_ORIGINS=$ALLOWED_ORIGINS
ARG AUTH_URL=
ENV AUTH_URL=$AUTH_URL

RUN corepack enable pnpm && pnpm build

# --------------------------------------------
# One-shot DB migrations (compose profile: migrate)
# --------------------------------------------
FROM node:${NODE_VERSION} AS migrate

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src/db ./src/db

RUN corepack enable pnpm

USER node

CMD ["pnpm", "exec", "drizzle-kit", "migrate"]

# --------------------------------------------
# Production runner
# --------------------------------------------
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p .next \
  && chown node:node .next

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["node", "server.js"]
