import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import { FileTable } from '@/client/components/filetable/FileTable';
import type { FsItem } from '@/client/core/types';

// Mock react-virtuoso with a trivial table that invokes the provided renderers
vi.mock('react-virtuoso', () => {
  return {
    TableVirtuoso: (props: any) => {
      const Header = props.fixedHeaderContent;
      const Row = (idx: number, it: any) => props.itemContent(idx, it);
      const items = props.data || [];
      const Components = props.components || {};
      const Table = Components.Table || ((p: any) => <table {...p} />);
      const Thead = Components.TableHead || ((p: any) => <thead {...p} />);
      const Tbody = Components.TableBody || ((p: any) => <tbody {...p} />);
      const Tr = Components.TableRow || ((p: any) => <tr {...p} />);
      return (
        <Table>
          <Thead>{Header && Header()}</Thead>
          <Tbody>
            {items.map((it: any, i: number) => (
              <Tr key={i}>{Row(i, it)}</Tr>
            ))}
          </Tbody>
        </Table>
      );
    },
  };
});

describe('FileTable', () => {
  const file: FsItem = {
    name: 'pic.png',
    path: '/pic.png',
    isDir: false,
    size: 42,
    mtimeMs: 0,
    mime: 'image/png',
  };

  it('renders header and rows; clicking row calls onItemClick', () => {
    const onItemClick = vi.fn();
    render(<FileTable items={[file]} onItemClick={onItemClick} selectedPaths={new Set()} />);

    // Header
    expect(screen.getByText(/Name/i)).toBeInTheDocument();
    // Row with name anchor
    fireEvent.click(screen.getByTestId('item-open'));
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/pic.png' }),
      0,
      expect.any(Object)
    );
  });
});
