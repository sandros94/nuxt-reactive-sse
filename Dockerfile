# Dockerfile with PNPM for Nuxt - v1.1.1
# https://gist.github.com/sandros94/03675514546f17af1fd6db3863c043b4

# Base configuration
FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc /app/
WORKDIR /app

# Builder
FROM base AS builder
ARG NUXT_UI_PRO_LICENSE
ENV NUXT_UI_PRO_LICENSE=$NUXT_UI_PRO_LICENSE

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --shamefully-hoist
COPY . .
RUN --mount=type=cache,id=nuxt,target=/app/node_modules/.cache/nuxt/.nuxt \
    pnpm run build

# Final production container
FROM node:20-alpine AS runtime
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

USER node
WORKDIR /app
EXPOSE 3000
HEALTHCHECK  --retries=10 --start-period=10s \
  CMD wget --no-verbose --spider http://0.0.0.0:3000/ || exit 1

COPY --link --from=builder /app/.output/  ./.output
#COPY --link --from=builder /app/content/  ./content

ENTRYPOINT [ "node", ".output/server/index.mjs" ]
