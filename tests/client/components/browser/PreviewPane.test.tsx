import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import { PreviewPane } from '@/client/components/browser/PreviewPane';
import type { FsItem } from '@/client/core/types';

vi.mock('@/client/services/apiClient', async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    api: {
      ...actual.api,
      previewUrl: (p: string) => `/preview${p}`,
    },
  };
});

describe('PreviewPane', () => {
  const img: FsItem = {
    name: 'pic.png',
    path: '/pic.png',
    isDir: false,
    size: 1024,
    mtimeMs: 0,
    mime: 'image/png',
  };

  it('renders PreviewPanel for image item and Close triggers onDeselect', () => {
    const onDeselect = vi.fn();
    render(<PreviewPane item={img} onDeselect={onDeselect} />);

    // Image meta block rendered by PreviewPanel
    expect(screen.getByTestId('image-meta')).toBeInTheDocument();

    // Close button
    const btn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(btn);
    expect(onDeselect).toHaveBeenCalled();
  });
});
