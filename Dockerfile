# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV PORT=8080

# default root inside container; mount volume here
ENV FILEBROWSER_ROOT=/data
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# create data dir and switch permissions
RUN mkdir -p /data && chown -R app:app /data /app
USER app
EXPOSE 8080
CMD ["node", "dist-server/index.js"]
