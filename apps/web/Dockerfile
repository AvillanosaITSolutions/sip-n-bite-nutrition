# syntax=docker/dockerfile:1.7

# ------------- Base image with pnpm -------------
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm" PATH="/pnpm:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# ------------- Install dependencies -------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ------------- Build the SPA -------------
FROM deps AS build
ARG VITE_API_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_AUTH0_DOMAIN=${VITE_AUTH0_DOMAIN} \
    VITE_AUTH0_CLIENT_ID=${VITE_AUTH0_CLIENT_ID} \
    VITE_AUTH0_AUDIENCE=${VITE_AUTH0_AUDIENCE}
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @snb/shared build && pnpm --filter @snb/web build

# ------------- Runtime: nginx serving static files -------------
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ || exit 1
