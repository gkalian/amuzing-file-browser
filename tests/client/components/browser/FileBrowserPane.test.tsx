import React, { createRef } from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import { FileBrowserPane } from '@/client/components/browser/FileBrowserPane';
import type { FsItem } from '@/client/core/types';

vi.mock('@/client/components/browser/SplitContainer', () => ({
  SplitContainer: (props: any) => (
    <div data-testid="split-mock">
      <div data-testid="left-slot">{props.left}</div>
      {props.showRight ? <div data-testid="right-slot">{props.right}</div> : null}
    </div>
  ),
}));

vi.mock('@/client/components/browser/LeftPane', () => ({
  LeftPane: (_props: any) => <div data-testid="left-pane" />,
}));

vi.mock('@/client/components/browser/PreviewPane', () => ({
  PreviewPane: (props: any) => (
    <div>
      <div data-testid="preview-pane-mock" />
      <button onClick={props.onDeselect}>Close</button>
    </div>
  ),
}));

describe('FileBrowserPane', () => {
  const img: FsItem = {
    name: 'pic.png',
    path: '/pic.png',
    isDir: false,
    size: 100,
    mtimeMs: 0,
    mime: 'image/png',
  };

  it('does not show preview when nothing selected', () => {
    render(
      <FileBrowserPane
        items={[img]}
        loading={false}
        selectedPaths={new Set()}
        onItemClick={() => {}}
        onDeselect={() => {}}
        showPreview={true}
        isNarrow={false}
        split={60}
        setDragging={() => {}}
        splitRef={createRef()}
        onDropUpload={() => {}}
      />
    );
    expect(screen.getByTestId('left-slot')).toBeInTheDocument();
    expect(screen.queryByTestId('right-slot')).toBeNull();
  });

  it('shows preview for single selected image and hides it after onDeselect', () => {
    const selected = new Set<string>(['/pic.png']);
    render(
      <FileBrowserPane
        items={[img]}
        loading={false}
        selectedPaths={selected}
        onItemClick={() => {}}
        onDeselect={() => {}}
        showPreview={true}
        isNarrow={false}
        split={60}
        setDragging={() => {}}
        splitRef={createRef()}
        onDropUpload={() => {}}
      />
    );

    // Preview visible
    expect(screen.getByTestId('right-slot')).toBeInTheDocument();
    expect(screen.getByTestId('preview-pane-mock')).toBeInTheDocument();

    // Click Close to call onDeselect prop, which FileBrowserPane maps to hide preview
    fireEvent.click(screen.getByText(/close/i));

    // After deselect, preview should be hidden
    expect(screen.queryByTestId('right-slot')).toBeNull();
  });
});
