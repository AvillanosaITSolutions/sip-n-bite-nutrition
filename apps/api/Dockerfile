# syntax=docker/dockerfile:1.7

# ------------- Base image with pnpm -------------
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# ------------- Install dependencies (workspace-aware) -------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ------------- Build (shared + api) -------------
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @snb/shared build && pnpm --filter @snb/api build

# ------------- Prune to production deps only -------------
FROM base AS prod-deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

# ------------- Final runtime image -------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
# Built shared package
COPY --from=build /repo/packages/shared/dist ./node_modules/@snb/shared/dist
COPY --from=build /repo/packages/shared/package.json ./node_modules/@snb/shared/package.json
# Built api
COPY --from=build /repo/apps/api/dist ./dist
# Production node_modules (no devDeps)
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/apps/api/node_modules ./apps/api/node_modules
# Persisted uploads live in /app/uploads — bind a docker volume here in prod.
RUN mkdir -p /app/uploads
EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]
