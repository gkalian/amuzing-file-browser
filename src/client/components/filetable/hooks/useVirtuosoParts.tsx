import React, { useCallback } from 'react';
import { Table } from '@mantine/core';

// Provides Virtuoso table parts. Accepts a function to clear row DnD highlight
// when dragging over the background (tbody) instead of a folder cell.
export function useVirtuosoParts(clearDragOverPath: () => void) {
  const VirtTable = useCallback((props: any) => <Table {...props} highlightOnHover stickyHeader />, []);
  const VirtTableHead = Table.Thead;
  const VirtTableRow = Table.Tr as any;
  const VirtTableBody = useCallback(
    (props: any) => (
      <Table.Tbody
        {...props}
        data-testid="table-body"
        onDragOver={(e: React.DragEvent) => {
          const el = e.target as Element | null;
          if (el && !el.closest('[data-dnd-folder="true"]')) {
            clearDragOverPath();
          }
        }}
        onDragEnter={(e: React.DragEvent) => {
          const el = e.target as Element | null;
          if (el && !el.closest('[data-dnd-folder="true"]')) {
            clearDragOverPath();
          }
        }}
      />
    ),
    [clearDragOverPath]
  );

  return { VirtTable, VirtTableHead, VirtTableRow, VirtTableBody } as const;
}
