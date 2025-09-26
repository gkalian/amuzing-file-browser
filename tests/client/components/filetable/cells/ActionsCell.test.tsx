import React from 'react';
import { render, screen, fireEvent } from '../../../../utils/test-utils';
import { ActionsCell } from '@/client/components/filetable/cells/ActionsCell';
import type { FsItem } from '@/client/core/types';

vi.mock('@/client/components/filetable/hooks/useGetLink', () => {
  return { useGetLink: () => vi.fn() };
});

vi.mock('@/client/services/apiClient', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    api: {
      ...actual.api,
      downloadUrl: (p: string) => `/download${p}`,
    },
  };
});

describe('ActionsCell', () => {
  const base: FsItem = {
    name: 'f.jpg',
    path: '/f.jpg',
    isDir: false,
    size: 10,
    mtimeMs: 0,
    mime: 'image/jpeg',
  };

  it('renders actions for files', () => {
    render(<ActionsCell it={base} />);
    expect(screen.getByTestId('action-download')).toBeInTheDocument();
    expect(screen.getByTestId('action-get-link')).toBeInTheDocument();
  });

  it('does not render for directories and symlinks', () => {
    const { rerender } = render(<ActionsCell it={{ ...base, isDir: true }} />);
    expect(screen.queryByTestId('action-download')).toBeNull();
    expect(screen.queryByTestId('action-get-link')).toBeNull();

    rerender(<ActionsCell it={{ ...base, isDir: false, isSymlink: true }} />);
    expect(screen.queryByTestId('action-download')).toBeNull();
    expect(screen.queryByTestId('action-get-link')).toBeNull();
  });

  it('stops propagation on click', () => {
    const spy = vi.spyOn(Event.prototype, 'stopPropagation');
    render(<ActionsCell it={base} />);
    fireEvent.click(screen.getByTestId('action-download'));
    expect(spy).toHaveBeenCalled();
  });
});
