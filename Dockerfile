###########################
#     BASE CONTAINER      #
###########################
FROM node:20-alpine3.20 AS base

RUN apk add --no-cache openssl

###########################
#    BUILDER CONTAINER    #
###########################
FROM base AS builder

# libc6-compat sometimes required on alpine for native deps
RUN apk add --no-cache libc6-compat jq
WORKDIR /app

# Bring in the full repo for pruning
COPY . .

# Turbo for pruning/build graph
RUN npm install -g "turbo@^1.9.3"

# Outputs to /app/out (json, full, lockfile, etc.)
RUN turbo prune --scope=@documenso/remix --docker

###########################
#   INSTALLER CONTAINER   #
###########################
FROM base AS installer

# Build-time tools for native deps (aws-crt, etc.)
RUN apk add --no-cache libc6-compat jq make cmake g++ openssl bash

WORKDIR /app

# Disable non-CI noise and telemetry
ENV HUSKY=0
ENV DOCKER_OUTPUT=1
ENV NEXT_TELEMETRY_DISABLED=1

# More heap for TypeScript/rollup/react-router build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# ⚠️ If your build truly needs these, consider passing at runtime instead of baking into the image
ARG NEXT_PRIVATE_ENCRYPTION_KEY="CAFEBABE"
ENV NEXT_PRIVATE_ENCRYPTION_KEY="${NEXT_PRIVATE_ENCRYPTION_KEY}"
ARG NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY="DEADBEEF"
ENV NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY="${NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY}"

# Install dependencies using the pruned lockfile
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY --from=builder /app/lingui.config.ts ./lingui.config.ts

RUN npm ci

# Then copy the pruned sources and turbo.json
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Install turbo (global) for the build
RUN npm install -g "turbo@^1.9.3"

# Build only the Remix app; keep concurrency low to reduce memory spikes
RUN turbo run build --filter=@documenso/remix... --concurrency=1

###########################
#     RUNNER CONTAINER    #
###########################
FROM base AS runner

ENV HUSKY=0
ENV DOCKER_OUTPUT=1

# Drop root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app

# Minimal files needed at runtime
COPY --from=builder --chown=nodejs:nodejs /app/out/json/ .
COPY --from=builder --chown=nodejs:nodejs /app/out/full/packages/tailwind-config ./packages/tailwind-config

# Production deps only
RUN npm ci --only=production

# Copy built Remix server and public assets
COPY --from=installer --chown=nodejs:nodejs /app/apps/remix/build ./apps/remix/build
COPY --from=installer --chown=nodejs:nodejs /app/apps/remix/public ./apps/remix/public

# Copy Prisma schema & migrations, then generate client
COPY --from=installer --chown=nodejs:nodejs /app/packages/prisma/schema.prisma ./packages/prisma/schema.prisma
COPY --from=installer --chown=nodejs:nodejs /app/packages/prisma/migrations ./packages/prisma/migrations
RUN npx prisma generate --schema ./packages/prisma/schema.prisma

# Start script (uncomment/adapt to your setup)
# COPY --chown=nodejs:nodejs ./docker/start.sh /app/apps/remix/start.sh
# WORKDIR /app/apps/remix
# CMD ["sh", "start.sh"]
