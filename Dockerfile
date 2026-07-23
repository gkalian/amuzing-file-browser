# syntax=docker/dockerfile:1

# ---- Build stage: install all deps and build client + server ----
FROM node:24-alpine AS build

WORKDIR /app

# Install all deps (incl. dev) for the build
COPY package.json package-lock.json* ./
RUN npm ci

# Build client (dist) and server (dist-server)
COPY . .
RUN npm run build

# Prune dev dependencies so we can copy a lean node_modules into runtime
RUN npm prune --omit=dev --no-audit --no-fund && npm cache clean --force

# ---- Runtime stage: minimal image with only build output and prod deps ----
FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV FILEBROWSER_ROOT=/data

# Copy only what the server needs at runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/package.json ./package.json

# Create non-root user and data dir
RUN addgroup -S -g 1001 app \
 && adduser -S -D -H -u 1001 -G app app \
 && mkdir -p /data \
 && chown -R 1001:1001 /data /app
USER app

EXPOSE 8080
CMD ["node", "dist-server/index.js"]
