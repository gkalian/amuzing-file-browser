import React, { useCallback } from 'react';
import { Table } from '@mantine/core';
import type { ContextProp, ItemProps, TableBodyProps, TableProps } from 'react-virtuoso';

// Provides Virtuoso table parts. Accepts a function to clear row DnD highlight
// when dragging over the background (tbody) instead of a folder cell.
export function useVirtuosoParts<Data>(clearDragOverPath: () => void) {
  const VirtTable = useCallback(
    (props: TableProps) => <Table {...props} highlightOnHover stickyHeader />,
    []
  );
  const VirtTableHead = Table.Thead;
  // Mantine's <Table.Tr> doesn't declare Virtuoso's row props (item, data-index, ...),
  // but forwards unknown props at runtime; cast through the real shape instead of `any`.
  const VirtTableRow = Table.Tr as unknown as React.ComponentType<
    ItemProps<Data> & ContextProp<unknown>
  >;
  const VirtTableBody = useCallback(
    (props: TableBodyProps) => (
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
