import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '../../../utils/test-utils';
import { App } from '@/client/App';
import { api } from '@/client/services/apiClient';
import type { FsItem } from '@/client/core/types';

// Mock FileBrowserPane to control selection flow and observe selectedPaths size
vi.mock('@/client/components/browser/FileBrowserPane', () => ({
  FileBrowserPane: (props: any) => {
    const { items, selectedPaths, onItemClick } = props;
    const first: FsItem | undefined = items?.[0];
    return (
      <div>
        <div data-testid="selected-count">{selectedPaths?.size ?? 0}</div>
        <button
          onClick={() =>
            first &&
            onItemClick(first, 0, { ctrlKey: false, metaKey: false, shiftKey: false } as any)
          }
        >
          SelectFirst
        </button>
      </div>
    );
  },
}));

// Keep SplitContainer/PreviewPane out of the way in case they render
vi.mock('@/client/components/browser/SplitContainer', () => ({
  SplitContainer: (props: any) => (
    <div>
      <div data-testid="left-slot">{props.left}</div>
      {props.showRight ? <div data-testid="right-slot">{props.right}</div> : null}
    </div>
  ),
}));

// Provide a stable list of files for api.list
const makeItems = (n: number): FsItem[] => {
  const arr: FsItem[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({
      name: `file_${i}.png`,
      path: `/file_${i}.png`,
      isDir: false,
      size: 100 + i,
      mtimeMs: 0,
      mime: 'image/png',
    });
  }
  return arr;
};

describe('App pagination clears selection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('clears selection when page changes', async () => {
    const items = makeItems(60); // 3+ pages by default (25 per page)
    const listSpy = vi.spyOn(api, 'list').mockResolvedValue({ items } as any);

    render(<App />);

    // wait for list load
    await waitFor(() => expect(listSpy).toHaveBeenCalled());

    // Initially selection count is 0
    expect(screen.getByTestId('selected-count').textContent).toBe('0');

    // Select first item on page 1
    fireEvent.click(screen.getByText('SelectFirst'));

    // selection should become 1
    await waitFor(() => expect(screen.getByTestId('selected-count').textContent).toBe('1'));

    // Change to page 2 via Pagination control in BottomBar
    const pager = await screen.findByTestId('pager-controls');
    // Click the button with text '2'
    const page2 = within(pager).getByRole('button', { name: '2' });
    fireEvent.click(page2);

    // After page change, selection should be cleared (0)
    await waitFor(() => expect(screen.getByTestId('selected-count').textContent).toBe('0'));
  });
});
