// Visual dashed border overlay for drop zones (no background fill)
import { Box } from '@mantine/core';
import React from 'react';

export function DropOverlay(props: { visible: boolean; testId?: string }) {
  const { visible, testId } = props;
  if (!visible) return null;
  return (
    <Box
      data-testid={testId || 'drop-overlay'}
      style={{
        position: 'absolute',
        inset: 0,
        border: '2px dashed var(--mantine-color-blue-5)',
        borderRadius: 6,
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  );
}
