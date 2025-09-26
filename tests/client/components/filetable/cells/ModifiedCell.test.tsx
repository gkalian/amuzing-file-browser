import React from 'react';
import { render, screen } from '../../../../utils/test-utils';
import { ModifiedCell } from '@/client/components/filetable/cells/ModifiedCell';
import type { FsItem } from '@/client/core/types';

describe('ModifiedCell', () => {
  const base: FsItem = {
    name: 'file.txt',
    path: '/file.txt',
    isDir: false,
    size: 0,
    mtimeMs: 1700000000000,
    mime: 'text/plain',
  };

  it('renders displayMtime when provided', () => {
    render(<ModifiedCell it={{ ...base, displayMtime: 'yesterday' }} />);
    expect(screen.getByText('yesterday')).toBeInTheDocument();
  });

  it('renders formatted date when displayMtime is missing', () => {
    render(<ModifiedCell it={base} />);
    // Just assert something was rendered (locale string varies)
    expect(screen.getByText(/\d/)).toBeInTheDocument();
  });
});
