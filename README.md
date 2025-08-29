# Amuzing File Browser

A minimal file browser you can run locally, in Docker, and on Kubernetes. It serves a directory (`FILEBROWSER_ROOT`) for listing, uploading, deleting, renaming, creating folders, downloading, and previewing files (text and images including WebP). No auth.

## Features

- Directory listing, stat
- Upload (multipart), download
- Create folder, rename/move, delete (file/dir)
- Image preview (webp supported)
- Configurable root via `FILEBROWSER_ROOT`
- Single package.json (client + server)
- Vite + React + Mantine UI, Express server

## Local Development

1. Install deps

```
npm ci
```

2. Start dev (set root if needed)

```
set FILEBROWSER_ROOT=c:\\path\\to\\serve   # Windows PowerShell: $env:FILEBROWSER_ROOT="C:\\path\\to\\serve"
npm run dev
```

3. Open http://localhost:3500

## Production (Node)

```
npm ci
npm run build
set FILEBROWSER_ROOT=/absolute/path
npm start
```

## Docker

## Kubernetes (Helm)

## Tech

- Client: `src/client/` (Vite, React, Mantine)
- Server: `src/server/` (Express)
- Helm chart: `helm/`
- Dockerfile at project root.
