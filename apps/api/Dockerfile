# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=apps/api

COPY apps/api ./apps/api

RUN npm -w apps/api run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=apps/api --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist

RUN chown -R node:node /app

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

USER node

CMD ["node", "apps/api/dist/index.js"]
