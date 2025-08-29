// File browser pane: composes FileTable and optional PreviewPanel with a draggable split.
import { Box, Group, Loader } from '@mantine/core';
import type { FsItem } from '../services/apiClient';
import { FileTable } from './FileTable';
import { PreviewPanel } from './PreviewPanel';
import { MutableRefObject } from 'react';

export function FileBrowserPane(props: {
  items: FsItem[];
  loading: boolean;
  selected: FsItem | null;
  onOpen: (item: FsItem) => void;
  onRequestRename: (item: FsItem) => void;
  onDelete: (item: FsItem) => Promise<void> | void;
  showPreview: boolean;
  isNarrow: boolean;
  split: number;
  setDragging: (v: boolean) => void;
  splitRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const {
    items,
    loading,
    selected,
    onOpen,
    onRequestRename,
    onDelete,
    showPreview,
    isNarrow,
    split,
    setDragging,
    splitRef,
  } = props;

  const showImagePreview = showPreview && !isNarrow && selected && (selected.mime || '').startsWith('image/');

  return (
    <Box style={{ position: 'relative' }}>
      <Box
        ref={splitRef as any}
        style={{ display: 'flex', gap: 0, height: 'calc(100vh - 72px - 56px - 120px)' }}
        data-testid="split-container"
      >
        <Box
          style={{
            position: 'relative',
            width: showImagePreview ? `${split}%` : '100%',
          }}
        >
          {loading && (
            <Group style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
              <Loader size="sm" />
            </Group>
          )}
          <FileTable
            items={items}
            onOpen={onOpen}
            onRequestRename={onRequestRename}
            onDelete={onDelete}
            selectedPath={selected?.path || null}
          />
        </Box>

        {showImagePreview && (
          <Box
            data-testid="split-resizer"
            style={{
              width: 6,
              cursor: 'col-resize',
              background: 'var(--mantine-color-default-border)',
              userSelect: 'none',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
          />
        )}

        {showImagePreview && (
          <Box style={{ width: `${100 - split}%`, paddingLeft: 10, height: '100%' }} data-testid="preview-pane">
            <PreviewPanel item={selected} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
