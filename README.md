# Amuzing File Browser

![React](https://img.shields.io/badge/react-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Express](https://img.shields.io/badge/express-%23404d59.svg?style=for-the-badge&logo=express&logoColor=white) ![Mantine](https://img.shields.io/badge/mantine-%2300B4D8.svg?style=for-the-badge&logo=mantine&logoColor=white) ![GitHub license](https://img.shields.io/github/license/gkalian/timeline-generator?style=for-the-badge)

A minimal file browser you can run locally, in Docker, and on Kubernetes (future taks, current helm chart is a draf). It serves a directory for listing, uploading, deleting, renaming, moving, creating folders, downloading, and previewing files (images including WebP). No auth.

Before starting this project, I have checked what is already existed. I found multiple apps including [gtsteffaniak's File Browser](https://github.com/gtsteffaniak/filebrowser). Even so it is a great tool so far, it is a bit overcomplicated for me and my needs. So I decided to make my own simple file browser.

It is mostly vibe-coded project with Windsurf AI as I am not a developer, so I strongly recommend to check [gtsteffaniak's File Browser](https://github.com/gtsteffaniak/filebrowser) for more features. You may use this project on your own risk. I do not take any responsibility for any damage or loss of your data. But in case you still want to use it, feel free to do so. 

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

1. Install deps

```
npm install
npm run dev
set FILEBROWSER_ROOT=c:\\path\\to\\serve in Settings
```

Open http://localhost:3500

## Docker

## Kubernetes

## Credits

- Header icon by [Icons8](https://icons8.com/)
- Windsurf AI