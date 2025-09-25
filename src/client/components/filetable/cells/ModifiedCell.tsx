import React from 'react';
import type { FsItem } from '../../../core/types';

export function ModifiedCell(props: { it: FsItem & { mtimeMs: number; displayMtime?: string } }) {
  const { it } = props;
  return <>{it.displayMtime ?? new Date(it.mtimeMs).toLocaleString()}</>;
}
