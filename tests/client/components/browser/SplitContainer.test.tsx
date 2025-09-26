import React, { createRef } from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import { SplitContainer } from '@/client/components/browser/SplitContainer';

describe('SplitContainer', () => {
  const splitRef = createRef<HTMLDivElement>();

  it('renders without right pane when showRight=false', () => {
    render(
      <SplitContainer
        left={<div data-testid="left-pane">left</div>}
        right={<div data-testid="right-pane">right</div>}
        showRight={false}
        split={60}
        setDragging={() => {}}
        splitRef={splitRef}
      />
    );
    expect(screen.getByTestId('split-container')).toBeInTheDocument();
    expect(screen.queryByTestId('split-resizer')).toBeNull();
    expect(screen.queryByTestId('preview-pane')).toBeNull();
  });

  it('shows resizer and right pane when showRight=true and triggers setDragging', () => {
    const setDragging = vi.fn();
    render(
      <SplitContainer
        left={<div data-testid="left-pane">left</div>}
        right={<div data-testid="right-pane">right</div>}
        showRight={true}
        split={50}
        setDragging={setDragging}
        splitRef={splitRef}
      />
    );
    expect(screen.getByTestId('split-resizer')).toBeInTheDocument();
    expect(screen.getByTestId('preview-pane')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('split-resizer'));
    expect(setDragging).toHaveBeenCalledWith(true);
  });
});
