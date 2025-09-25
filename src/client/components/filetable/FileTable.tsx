// Virtualized file table listing with actions (open, rename, link, delete)
import React, { memo, useCallback, useState } from 'react';
import type { FsItem } from '../../core/types';
import { TableVirtuoso } from 'react-virtuoso';
import { FileTableHeader } from './FileTableHeader';
import { useNumberFmt } from './hooks/useNumberFmt';
import { useVirtuosoParts } from './hooks/useVirtuosoParts';
import { FileRow } from './FileRow';

type Item = FsItem & { displaySize?: string; displayMtime?: string };
type Props = {
  items: Item[];
  onItemClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
  selectedPaths: Set<string>;
  onDropUpload?: (targetDir: string | null, files: File[]) => void;
};

// Virtuoso components provided by hook (includes custom tbody to clear DnD row highlight)

const FileTableBase: React.FC<Props> = ({ items, onItemClick, selectedPaths, onDropUpload }) => {
  const numberFmt = useNumberFmt();
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  // Memoized header and row renderer to minimize allocations
  const headerContent = useCallback(() => <FileTableHeader />, []);

  const itemContent = useCallback(
    (idx: number, it: Item) => {
      const isSelected = selectedPaths.has(it.path);
      const selStyle = isSelected
        ? { background: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-4))' }
        : undefined;
      const isFolderDnDTarget = it.isDir && !it.isSymlink;
      const isRowDragOver = dragOverPath === it.path;

      return (
        <FileRow
          idx={idx}
          it={it}
          isSelected={isSelected}
          selStyle={selStyle}
          isRowDragOver={isRowDragOver}
          isFolderDnDTarget={isFolderDnDTarget}
          numberFmt={numberFmt}
          onItemClick={onItemClick}
          onDropUpload={onDropUpload}
          setDragOverPath={setDragOverPath}
        />
      );
    },
    [numberFmt, onItemClick, onDropUpload, selectedPaths, dragOverPath]
  );

  // Virtuoso parts (with tbody that clears row highlight on background hover)
  const { VirtTable, VirtTableHead, VirtTableRow, VirtTableBody } = useVirtuosoParts(() =>
    setDragOverPath(null)
  );

  return (
    <TableVirtuoso<Item>
      data={items}
      style={{ height: '100%' }}
      computeItemKey={(_, it) => it.path}
      increaseViewportBy={{ top: 200, bottom: 400 }}
      components={{
        Table: VirtTable,
        TableHead: VirtTableHead,
        TableRow: VirtTableRow,
        TableBody: VirtTableBody,
      }}
      fixedHeaderContent={headerContent}
      itemContent={itemContent}
    />
  );
};

export const FileTable = memo(FileTableBase) as React.MemoExoticComponent<React.FC<Props>>;
