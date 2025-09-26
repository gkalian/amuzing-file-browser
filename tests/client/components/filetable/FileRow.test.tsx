import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import { Table } from '@mantine/core';
import { FileRow } from '@/client/components/filetable/FileRow';
import type { FsItem } from '@/client/core/types';

describe('FileRow', () => {
  const base: FsItem = {
    name: 'folder',
    path: '/folder',
    isDir: true,
    size: 0,
    mtimeMs: 0,
    mime: null,
  };

  it('renders and calls onItemClick on cell click', () => {
    const onItemClick = vi.fn();
    render(
      <Table>
        <Table.Tbody>
          <Table.Tr>
            <FileRow
              idx={0}
              it={base}
              isSelected={false}
              selStyle={undefined}
              isRowDragOver={false}
              isFolderDnDTarget={true}
              numberFmt={new Intl.NumberFormat()}
              onItemClick={onItemClick}
              setDragOverPath={() => {}}
            />
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );

    const cells = screen.getAllByRole('cell');
    fireEvent.click(cells[0]);
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/folder' }),
      0,
      expect.any(Object)
    );
  });

  it('marks folder cells as DnD targets', () => {
    render(
      <Table>
        <Table.Tbody>
          <Table.Tr>
            <FileRow
              idx={0}
              it={base}
              isSelected={false}
              selStyle={undefined}
              isRowDragOver={false}
              isFolderDnDTarget={true}
              numberFmt={new Intl.NumberFormat()}
              onItemClick={() => {}}
              setDragOverPath={() => {}}
            />
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
    const cells = screen.getAllByRole('cell');
    // First two cells carry data-dnd-folder
    expect(cells[0]).toHaveAttribute('data-dnd-folder', 'true');
    expect(cells[1]).toHaveAttribute('data-dnd-folder', 'true');
  });
});
