import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import { LeftPane } from '@/client/components/browser/LeftPane';
import type { FsItem } from '@/client/core/types';

vi.mock('@/client/components/filetable/FileTable', () => ({
  FileTable: (props: any) => (
    <div data-testid="file-table" onClick={() => props.onItemClick?.(props.items?.[0], 0, {})} />
  ),
}));

describe('LeftPane', () => {
  const items: FsItem[] = [
    { name: 'a.txt', path: '/a.txt', isDir: false, size: 1, mtimeMs: 0, mime: 'text/plain' },
  ];

  it('shows loader when loading=true', () => {
    const { container } = render(
      <LeftPane
        items={items}
        loading={true}
        selectedPaths={new Set()}
        onItemClick={() => {}}
        onDropUpload={() => {}}
      />
    );
    // Mantine Loader does not expose an ARIA role by default; check its stable class
    expect(container.querySelector('.mantine-Loader-root')).toBeTruthy();
  });

  it('shows overlay on drag over with files and calls onDropUpload on drop', () => {
    const onDropUpload = vi.fn();
    render(
      <LeftPane
        items={items}
        loading={false}
        selectedPaths={new Set()}
        onItemClick={() => {}}
        onDropUpload={onDropUpload}
      />
    );

    // Root Box is the parent of the mocked FileTable
    const root = screen.getByTestId('file-table').parentElement as HTMLElement;

    // drag over with Files type to show overlay
    fireEvent.dragOver(root, { dataTransfer: { types: ['Files'] } } as any);
    expect(screen.getByTestId('table-drop-overlay')).toBeInTheDocument();

    // drop files to trigger callback
    const f = new File(['a'], 'a.txt', { type: 'text/plain' });
    fireEvent.drop(root, { dataTransfer: { types: ['Files'], files: [f] } } as any);

    expect(onDropUpload).toHaveBeenCalledWith(null, [expect.any(File)]);
  });
});
