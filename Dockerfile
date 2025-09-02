FROM node:22-alpine

WORKDIR /app

# Install all deps for build
COPY package.json package-lock.json* ./
RUN npm ci

# Build client and server
COPY . .
RUN npm run build

# Remove dev dependencies to slim runtime
# RUN npm prune --omit=dev --no-audit --no-fund && npm cache clean --force

# Runtime env
ENV NODE_ENV=production
ENV PORT=8080
ENV FILEBROWSER_ROOT=/data

# Create non-root user and data dir
RUN addgroup -S -g 1001 app \
 && adduser -S -D -H -u 1001 -G app app \
 && mkdir -p /data \
 && chown -R 1001:1001 /data /app
USER app

EXPOSE 8080
CMD ["node", "dist-server/index.js"]
