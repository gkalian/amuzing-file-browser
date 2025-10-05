// LeftPane: table area with loader, DnD overlay, and callbacks
import React, { useState } from 'react';
import { Box, Group, Loader } from '@mantine/core';
import type { FsItem } from '../../core/types';
import { FileTable } from '../filetable/FileTable';
import { DropOverlay } from './DropOverlay';

export function LeftPane(props: {
  items: FsItem[];
  loading: boolean;
  selectedPaths: Set<string>;
  onItemClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
  onDropUpload: (targetDir: string | null, files: File[]) => void;
  sortField: 'name' | 'size' | 'mtime' | null;
  sortDir: 'asc' | 'desc';
  onSort: (field: 'name' | 'size' | 'mtime') => void;
}) {
  const { items, loading, selectedPaths, onItemClick, onItemDoubleClick, onDropUpload, sortField, sortDir, onSort } =
    props;

  const [isDragOver, setIsDragOver] = useState(false);
  const hasFiles = (e: React.DragEvent) =>
    Array.from(e.dataTransfer?.types || []).includes('Files');

  return (
    <Box
      style={{ position: 'relative', height: '100%' }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
      }}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        onDropUpload(null, files);
        setIsDragOver(false);
      }}
    >
      {loading && (
        <Group style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
          <Loader size="sm" />
        </Group>
      )}
      <DropOverlay visible={isDragOver} testId="table-drop-overlay" />
      <FileTable
        items={items}
        onItemClick={onItemClick}
        onItemDoubleClick={onItemDoubleClick}
        selectedPaths={selectedPaths}
        onDropUpload={onDropUpload}
        sortField={sortField}
        sortDir={sortDir}
        onSort={onSort}
      />
    </Box>
  );
}
