import React from 'react';
import type { FsItem } from '../../../core/types';

export function SizeCell(props: { it: FsItem & { size: number; displaySize?: string }; numberFmt: Intl.NumberFormat }) {
  const { it, numberFmt } = props;
  if (it.isDir) return <>-</>;
  return <>{it.displaySize ?? numberFmt.format(it.size)}</>;
}
