// SplitContainer: layout with left and optional right pane, plus draggable resizer
import React, { RefObject } from 'react';
import { Box } from '@mantine/core';

export function SplitContainer(props: {
  left: React.ReactNode;
  right: React.ReactNode;
  showRight: boolean;
  split: number; // percentage width of left pane when right is shown
  setDragging: (v: boolean) => void;
  splitRef: RefObject<HTMLDivElement | null>;
}) {
  const { left, right, showRight, split, setDragging, splitRef } = props;
  return (
    <Box style={{ position: 'relative' }}>
      <Box
        ref={splitRef}
        style={{ display: 'flex', gap: 0, height: 'calc(100vh - 72px - 56px - 120px)' }}
        data-testid="split-container"
      >
        <Box style={{ position: 'relative', width: showRight ? `${split}%` : '100%' }}>{left}</Box>

        {showRight && (
          <Box
            data-testid="split-resizer"
            style={{
              width: 6,
              cursor: 'col-resize',
              background: 'var(--mantine-color-default-border)',
              userSelect: 'none',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
          />
        )}

        {showRight && (
          <Box style={{ width: `${100 - split}%`, paddingLeft: 10, height: '100%' }} data-testid="preview-pane">
            {right}
          </Box>
        )}
      </Box>
    </Box>
  );
}
