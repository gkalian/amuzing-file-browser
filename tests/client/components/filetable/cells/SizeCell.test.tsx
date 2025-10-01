import React from 'react';
import { render, screen } from '../../../../utils/test-utils';
import { SizeCell } from '@/client/components/filetable/cells/SizeCell';
import type { FsItem } from '@/client/core/types';

describe('SizeCell', () => {
  const base: FsItem = {
    name: 'file.bin',
    path: '/file.bin',
    isDir: false,
    size: 1234,
    mtimeMs: 0,
    mime: 'application/octet-stream',
  };

  it('renders dash for directories', () => {
    const it: FsItem = { ...base, isDir: true };
    render(<SizeCell it={it as any} numberFmt={new Intl.NumberFormat('en-US')} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders formatted size when displaySize not provided', () => {
    render(<SizeCell it={base as any} numberFmt={new Intl.NumberFormat('en-US')} />);
    const el = screen.getByText('1.2 KB');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('title', '1,234 B');
  });

  it('renders displaySize when provided', () => {
    render(
      <SizeCell
        it={{ ...base, displaySize: '1.2 KB' } as any}
        numberFmt={new Intl.NumberFormat()}
      />
    );
    expect(screen.getByText('1.2 KB')).toBeInTheDocument();
  });
});
