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
RUN addgroup -S app && adduser -S app -G app && \
    mkdir -p /data && chown -R app:app /data /app
USER app

EXPOSE 8080
CMD ["node", "dist-server/index.js"]
