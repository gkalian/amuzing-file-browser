// PreviewPane: right-side panel hosting PreviewPanel with padding & height
import React from 'react';
import { Box } from '@mantine/core';
import type { FsItem } from '../../core/types';
import { PreviewPanel } from '../preview/PreviewPanel';

export function PreviewPane(props: { item: FsItem; onDeselect: () => void }) {
  const { item, onDeselect } = props;
  return (
    <Box style={{ width: '100%', height: '100%' }}>
      <PreviewPanel item={item} onDeselect={onDeselect} />
    </Box>
  );
}
