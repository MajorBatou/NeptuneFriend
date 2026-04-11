# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install deps
RUN npm ci --workspace=apps/web

# Copy source
COPY apps/web ./apps/web

# Build React app
ARG VITE_API_URL
ARG VITE_APP_ENV=production
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_ENV=$VITE_APP_ENV

RUN npm -w apps/web run build

# Stage 2: Serve with nginx
FROM nginx:1.27-alpine AS runner

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# nginx config for SPA routing
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
