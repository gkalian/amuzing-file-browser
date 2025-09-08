# Amuzing File Browser

![React](https://img.shields.io/badge/react-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Express](https://img.shields.io/badge/express-%23404d59.svg?style=for-the-badge&logo=express&logoColor=white) ![Mantine](https://img.shields.io/badge/mantine-%2300B4D8.svg?style=for-the-badge&logo=mantine&logoColor=white) ![GitHub license](https://img.shields.io/github/license/gkalian/timeline-generator?style=for-the-badge)

A minimal file browser you can run locally, in Docker, and on Kubernetes (future tasks, current helm chart is a draft). It serves a directory for listing, uploading, deleting, renaming, moving, creating folders, downloading, and previewing files (images including WebP). No auth.

Before starting this project, I have checked what is already existed. I found multiple apps including [gtsteffaniak's File Browser](https://github.com/gtsteffaniak/filebrowser). Even so it is a great tool so far, it is a bit overcomplicated for me and my needs. So I decided to make my own simple file browser.

It is mostly vibe-coded project with Windsurf AI as I am not a developer, so I strongly recommend to check [gtsteffaniak's File Browser](https://github.com/gtsteffaniak/filebrowser) for more features. You may use this project on your own risk. I do not take any responsibility for any damage or loss of your data.

All suggestions, bug reports, and pull requests are welcome.

## Features

- Directory listing, stat
- Upload (multipart), download files
- Create folder, rename/move, delete (file/dir)
- Image preview
- Configurable settings (root folder, max upload size, allowed file types, theme).
- Language selection (English, Russian)
- Light and dark themes by Mantine

## Local Development

- Install deps

```
npm install
npm run dev
set FILEBROWSER_ROOT=c:\\path\\to\\serve in Settings
```

- Open http://localhost:3500

## Docker

Build and run the application using Docker:

```bash
# Build the image
docker build -t amuzing-file-browser .

# Run with default settings (serves /data directory)
docker run -p 8080:8080 -v /path/to/your/files:/data amuzing-file-browser

# Run with custom environment variables
docker run -p 8080:8080 \
  -v /path/to/your/files:/data \
  -e FILEBROWSER_ROOT=/data \
  -e LOG_LEVEL=debug \
  amuzing-file-browser
```

## Domain separation (admin vs media)

You can split access by hostnames:

- Admin UI and full API: `my-custom-domain.domain.com`
- Public media (read-only): `media.domain.com`

The server enforces this via host-based middleware:

- On admin host: full access
- On media host: only GET to `/files/*`, `/api/fs/preview`, `/api/fs/download`, and `/api/health`
- If domains are unset (local dev), no restrictions are applied

Configure:

- Local/Docker env vars
  ```bash
  # Linux/macOS
  export ADMIN_DOMAIN=my-custom-domain.domain.com
  export MEDIA_DOMAIN=media.domain.com
  # Windows PowerShell
  $env:ADMIN_DOMAIN='my-custom-domain.domain.com'
  $env:MEDIA_DOMAIN='media.domain.com'
  ```

## Kubernetes

Will be done when helm chart will be published in this repo.

## Credits

- Header icon by [Icons8](https://icons8.com/)
- Windsurf AI
