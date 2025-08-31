// File browser pane: composes FileTable and optional PreviewPanel with a draggable split.
import { Box, Group, Loader } from '@mantine/core';
import type { FsItem } from '../services/apiClient';
import { FileTable } from './FileTable';
import { PreviewPanel } from './PreviewPanel';
import type { MutableRefObject, MouseEvent as ReactMouseEvent } from 'react';

export function FileBrowserPane(props: {
  items: FsItem[];
  loading: boolean;
  selectedPaths: Set<string>;
  onItemClick: (item: FsItem, index: number, e: ReactMouseEvent) => void;
  onRequestRename: (item: FsItem) => void;
  onDelete: (item: FsItem) => Promise<void> | void;
  onDeselect: () => void;
  showPreview: boolean;
  isNarrow: boolean;
  split: number;
  setDragging: (v: boolean) => void;
  splitRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const {
    items,
    loading,
    selectedPaths,
    onItemClick,
    onRequestRename,
    onDelete,
    onDeselect,
    showPreview,
    isNarrow,
    split,
    setDragging,
    splitRef,
  } = props;

  // Determine preview item: only when exactly one image file is selected
  const selectedItem: FsItem | null = (() => {
    if (selectedPaths.size !== 1) return null;
    const onlyPath = Array.from(selectedPaths)[0];
    const it = items.find((i) => i.path === onlyPath) || null;
    if (!it) return null;
    if ((it.mime || '').startsWith('image/')) return it;
    return null;
  })();
  const showImagePreview = showPreview && !isNarrow && !!selectedItem;

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
            onItemClick={onItemClick}
            onRequestRename={onRequestRename}
            onDelete={onDelete}
            selectedPaths={selectedPaths}
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
            <PreviewPanel item={selectedItem} onDeselect={onDeselect} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
