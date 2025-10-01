import React from 'react';
import { render, screen, fireEvent } from '../../../../utils/test-utils';
import { NameCell } from '@/client/components/filetable/cells/NameCell';
import type { FsItem } from '@/client/core/types';

describe('NameCell', () => {
  const base: FsItem = {
    name: 'file.txt',
    path: '/file.txt',
    isDir: false,
    size: 0,
    mtimeMs: 0,
    mime: 'text/plain',
  };

  it('renders item name', () => {
    render(<NameCell it={base} idx={0} isSymlink={false} onItemClick={() => {}} />);
    expect(screen.getByText('file.txt')).toBeInTheDocument();
  });

  it('calls onItemClick when not a symlink', () => {
    const onItemClick = vi.fn();
    render(<NameCell it={base} idx={2} isSymlink={false} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByTestId('item-open'));
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/file.txt' }),
      2,
      expect.any(Object)
    );
  });

  it('does not call onItemClick for symlink', () => {
    const onItemClick = vi.fn();
    render(
      <NameCell
        it={{ ...base, isSymlink: true }}
        idx={1}
        isSymlink={true}
        onItemClick={onItemClick}
      />
    );
    fireEvent.click(screen.getByTestId('item-open'));
    expect(onItemClick).not.toHaveBeenCalled();
  });
});
