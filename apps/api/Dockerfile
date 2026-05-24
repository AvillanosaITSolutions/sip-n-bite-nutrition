# syntax=docker/dockerfile:1.7

# ------------- Base image with pnpm -------------
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# ------------- Build (shared + api) -------------
FROM base AS build
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @snb/shared build && pnpm --filter @snb/api build
# Produce a self-contained production deployment with a flat node_modules.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter @snb/api deploy --prod /deploy

# ------------- Final runtime image -------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /deploy/dist ./dist
COPY --from=build /deploy/node_modules ./node_modules
COPY --from=build /deploy/package.json ./package.json
# Persisted uploads live in /app/uploads — bind a docker volume here in prod.
RUN mkdir -p /app/uploads
EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]
