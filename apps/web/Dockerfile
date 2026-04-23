# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=apps/web --ignore-scripts

# Stage 2: Build React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./apps/web
COPY package.json ./

ARG VITE_APP_ENV=production
ENV VITE_APP_ENV=$VITE_APP_ENV

RUN npm -w apps/web run build

# Stage 3: Production nginx server
FROM nginx:1.27-alpine AS runner

RUN apk upgrade --no-cache

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

RUN addgroup -g 1001 -S neptune && \
    adduser -S neptune -u 1001 -G neptune && \
    chown -R neptune:neptune /usr/share/nginx/html && \
    chown -R neptune:neptune /var/cache/nginx && \
    chown -R neptune:neptune /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R neptune:neptune /var/run/nginx.pid

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

USER neptune

CMD ["nginx", "-g", "daemon off;"]
