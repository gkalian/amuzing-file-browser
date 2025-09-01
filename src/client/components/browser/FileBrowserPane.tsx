// File browser pane: composes FileTable and optional PreviewPanel with a draggable split.
import { Box, Group, Loader } from '@mantine/core';
import type { FsItem } from '../../core/types';
import { FileTable } from './FileTable';
import { PreviewPanel } from '../preview/PreviewPanel';
import type { RefObject, MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';

export function FileBrowserPane(props: {
  items: FsItem[];
  loading: boolean;
  selectedPaths: Set<string>;
  onItemClick: (item: FsItem, index: number, e: ReactMouseEvent) => void;
  onItemDoubleClick: (item: FsItem, index: number, e: ReactMouseEvent) => void;
  onDeselect: () => void;
  showPreview: boolean;
  isNarrow: boolean;
  split: number;
  setDragging: (v: boolean) => void;
  splitRef: RefObject<HTMLDivElement | null>;
}) {
  const {
    items,
    loading,
    selectedPaths,
    onItemClick,
    onItemDoubleClick,
    showPreview,
    isNarrow,
    split,
    setDragging,
    splitRef,
  } = props;

  // Determine preview item: only when exactly one image file is selected
  const selectedItem: FsItem | null = useMemo(() => {
    if (selectedPaths.size !== 1) return null;
    const onlyPath = Array.from(selectedPaths)[0];
    const it = items.find((i) => i.path === onlyPath) || null;
    if (!it) return null;
    if ((it.mime || '').startsWith('image/')) return it;
    return null;
  }, [items, selectedPaths]);

  // Local suppression of preview (X button): do not clear selection
  const [hidePreview, setHidePreview] = useState(false);
  useEffect(() => {
    // when selection changes, re-enable preview panel
    setHidePreview(false);
  }, [selectedItem?.path]);

  const showImagePreview = showPreview && !isNarrow && !!selectedItem && !hidePreview;

  return (
    <Box style={{ position: 'relative' }}>
      <Box
        ref={splitRef}
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
            onItemDoubleClick={onItemDoubleClick}
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
          <Box
            style={{ width: `${100 - split}%`, paddingLeft: 10, height: '100%' }}
            data-testid="preview-pane"
          >
            <PreviewPanel item={selectedItem} onDeselect={() => setHidePreview(true)} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
