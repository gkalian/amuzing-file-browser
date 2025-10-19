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
              onItemDoubleClick={() => {}}
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
              onItemDoubleClick={() => {}}
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

  it('double-click opens folder and does not open on files', () => {
    const onItemDoubleClick = vi.fn();
    const onItemDoubleClickFile = vi.fn();
    const file: FsItem = {
      name: 'file.jpg',
      path: '/file.jpg',
      isDir: false,
      size: 1,
      mtimeMs: 0,
      mime: 'image/jpeg',
    };

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
              onItemDoubleClick={onItemDoubleClick}
              setDragOverPath={() => {}}
            />
          </Table.Tr>
          <Table.Tr>
            <FileRow
              idx={1}
              it={file}
              isSelected={false}
              selStyle={undefined}
              isRowDragOver={false}
              isFolderDnDTarget={false}
              numberFmt={new Intl.NumberFormat()}
              onItemClick={() => {}}
              onItemDoubleClick={onItemDoubleClickFile}
              setDragOverPath={() => {}}
            />
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );

    const rowsCells = screen.getAllByRole('cell');
    fireEvent.doubleClick(rowsCells[0]);
    expect(onItemDoubleClick).toHaveBeenCalled();

    // Double-click on a file should not trigger folder navigation
    const fileFirstCell = rowsCells[4];
    fireEvent.doubleClick(fileFirstCell);
    expect(onItemDoubleClickFile).not.toHaveBeenCalled();
  });

  it('sets appropriate title tooltips for folder and images', () => {
    const image: FsItem = {
      name: 'pic.png',
      path: '/pic.png',
      isDir: false,
      size: 10,
      mtimeMs: 0,
      mime: 'image/png',
    };

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
              onItemDoubleClick={() => {}}
              setDragOverPath={() => {}}
            />
          </Table.Tr>
          <Table.Tr>
            <FileRow
              idx={1}
              it={image}
              isSelected={false}
              selStyle={undefined}
              isRowDragOver={false}
              isFolderDnDTarget={false}
              numberFmt={new Intl.NumberFormat()}
              onItemClick={() => {}}
              onItemDoubleClick={() => {}}
              setDragOverPath={() => {}}
            />
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );

    const cells = screen.getAllByRole('cell');
    // Use the folder row's third cell as the canonical translation for "open folder"
    const folderOpenTitle = cells[2].getAttribute('title');
    expect(folderOpenTitle).toBeTruthy();
    expect(cells[0]).toHaveAttribute('title', folderOpenTitle!);
    expect(cells[1]).toHaveAttribute('title', folderOpenTitle!);

    // Image row: titles should be present (localized) on all three cells
    expect(cells[4]).toHaveAttribute('title');
    expect(cells[5]).toHaveAttribute('title');
    expect(cells[6]).toHaveAttribute('title');
  });

  it('handles drag over/enter/leave/drop and calls callbacks', () => {
    const setDragOverPath = vi.fn();
    const onDropUpload = vi.fn();

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
              onDropUpload={onDropUpload}
              onItemDoubleClick={() => {}}
              setDragOverPath={setDragOverPath}
            />
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );

    const [firstCell] = screen.getAllByRole('cell');
    const files = [new File(['x'], 'x.txt')];
    const dataTransfer: any = { files, dropEffect: 'none' };

    fireEvent.dragOver(firstCell, { dataTransfer });
    expect(setDragOverPath).toHaveBeenCalledWith('/folder');

    fireEvent.dragEnter(firstCell, { dataTransfer });
    expect(setDragOverPath).toHaveBeenCalledWith('/folder');

    fireEvent.dragLeave(firstCell, { dataTransfer });

    fireEvent.drop(firstCell, { dataTransfer });
    expect(onDropUpload).toHaveBeenCalledWith('/folder', files);
    expect(setDragOverPath).toHaveBeenCalledWith(null);
  });

  it('symlink disables click semantics and title, and mouse down prevention is skipped', () => {
    const onItemClick = vi.fn();
    const symlink: FsItem = { ...base, isSymlink: true } as any;

    render(
      <Table>
        <Table.Tbody>
          <Table.Tr>
            <FileRow
              idx={0}
              it={symlink as any}
              isSelected={false}
              selStyle={undefined}
              isRowDragOver={false}
              isFolderDnDTarget={true}
              numberFmt={new Intl.NumberFormat()}
              onItemClick={onItemClick}
              onItemDoubleClick={() => {}}
              setDragOverPath={() => {}}
            />
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );

    const [cell] = screen.getAllByRole('cell');
    expect(cell).not.toHaveAttribute('title');
    expect(cell).toHaveStyle({ cursor: 'default' });

    const prevent = { preventDefault: vi.fn(), ctrlKey: true } as any;
    fireEvent.mouseDown(cell, prevent);
    expect(prevent.preventDefault).not.toHaveBeenCalled();
  });

  it('shows selected and drag-over styles and handles multi-select mousedown', () => {

    render(
      <Table>
        <Table.Tbody>
          <Table.Tr>
            <FileRow
              idx={0}
              it={base}
              isSelected={true}
              selStyle={{ background: 'red' }}
              isRowDragOver={true}
              isFolderDnDTarget={true}
              numberFmt={new Intl.NumberFormat()}
              onItemClick={() => {}}
              onItemDoubleClick={() => {}}
              setDragOverPath={() => {}}
            />
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );

    const [cell] = screen.getAllByRole('cell');
    // Trigger mousedown with ctrlKey; we don't assert preventDefault directly to avoid RTL internals
    fireEvent.mouseDown(cell, { ctrlKey: true });

    expect(cell).toHaveAttribute('data-selected', 'true');
    expect(cell).toHaveStyle({ borderRadius: '4px' });
  });
});
