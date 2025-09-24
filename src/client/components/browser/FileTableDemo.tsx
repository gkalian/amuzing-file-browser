// Demo component to showcase symlink UI behavior
import React from 'react';
import { FileTable } from './FileTable';
import type { FsItem } from '../../core/types';

// Mock data with different types of symlinks for demonstration
const mockItems: (FsItem & { displaySize?: string; displayMtime?: string })[] = [
  {
    name: 'regular_file.txt',
    path: '/regular_file.txt',
    isDir: false,
    size: 1024,
    mtimeMs: Date.now(),
    mime: 'text/plain',
    displaySize: '1 KB',
    displayMtime: new Date().toLocaleString(),
  },
  {
    name: 'regular_folder',
    path: '/regular_folder',
    isDir: true,
    size: 0,
    mtimeMs: Date.now(),
    mime: null,
    displaySize: '-',
    displayMtime: new Date().toLocaleString(),
  },
  {
    name: 'good_symlink.txt',
    path: '/good_symlink.txt',
    isDir: false,
    size: 512,
    mtimeMs: Date.now(),
    mime: 'text/plain',
    isSymlink: true,
    isBroken: false,
    isUnsafe: false,
    displaySize: '512 B',
    displayMtime: new Date().toLocaleString(),
  },
  {
    name: 'broken_symlink.txt',
    path: '/broken_symlink.txt',
    isDir: false,
    size: 0,
    mtimeMs: Date.now(),
    mime: null,
    isSymlink: true,
    isBroken: true,
    isUnsafe: false,
    displaySize: '0 B',
    displayMtime: new Date().toLocaleString(),
  },
  {
    name: 'unsafe_symlink.txt',
    path: '/unsafe_symlink.txt',
    isDir: false,
    size: 0,
    mtimeMs: Date.now(),
    mime: null,
    isSymlink: true,
    isBroken: false,
    isUnsafe: true,
    displaySize: '0 B',
    displayMtime: new Date().toLocaleString(),
  },
];

export function FileTableDemo() {
  const selectedPaths = new Set<string>();

  const handleItemClick = (item: FsItem, index: number, e: React.MouseEvent) => {
    console.log('Item clicked:', item.name, 'isSymlink:', item.isSymlink);
  };

  const handleItemDoubleClick = (item: FsItem, index: number, e: React.MouseEvent) => {
    console.log('Item double-clicked:', item.name, 'isSymlink:', item.isSymlink);
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <h3>Symlink UI Demo</h3>
      <p>This demo shows how different types of files and symlinks appear in the table:</p>
      <ul>
        <li>
          <strong>Regular files/folders</strong> - clickable, with download/link buttons
        </li>
        <li>
          <strong>Good symlinks</strong> - blue badge, not clickable, no action buttons
        </li>
        <li>
          <strong>Broken symlinks</strong> - red badge with tooltip, not clickable
        </li>
        <li>
          <strong>Unsafe symlinks</strong> - orange badge with tooltip, not clickable
        </li>
      </ul>
      <FileTable
        items={mockItems}
        onItemClick={handleItemClick}
        onItemDoubleClick={handleItemDoubleClick}
        selectedPaths={selectedPaths}
      />
    </div>
  );
}
