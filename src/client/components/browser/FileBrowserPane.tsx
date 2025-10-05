// File browser pane: composes LeftPane (table) and optional PreviewPane with a draggable split.
import type { FsItem } from '../../core/types';
import type { RefObject, MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { SplitContainer } from './SplitContainer';
import { LeftPane } from './LeftPane';
import { PreviewPane } from './PreviewPane';

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
  onDropUpload: (targetDir: string | null, files: File[]) => void;
  sortField: 'name' | 'size' | 'mtime' | null;
  sortDir: 'asc' | 'desc';
  onSort: (field: 'name' | 'size' | 'mtime') => void;
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
    onDropUpload,
    sortField,
    sortDir,
    onSort,
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
    <SplitContainer
      splitRef={splitRef}
      split={split}
      setDragging={setDragging}
      showRight={showImagePreview}
      left={
        <LeftPane
          items={items}
          loading={loading}
          selectedPaths={selectedPaths}
          onItemClick={onItemClick}
          onItemDoubleClick={onItemDoubleClick}
          onDropUpload={onDropUpload}
          sortField={sortField}
          sortDir={sortDir}
          onSort={onSort}
        />
      }
      right={
        selectedItem ? (
          <PreviewPane item={selectedItem} onDeselect={() => setHidePreview(true)} />
        ) : null
      }
    />
  );
}
