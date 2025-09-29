import React from 'react';
import type { FsItem } from '../../../core/types';

export function SizeCell(props: {
  it: FsItem & { size: number; displaySize?: string };
  numberFmt: Intl.NumberFormat;
}) {
  const { it, numberFmt } = props;
  if (it.isDir) return <>-</>;

  const bytes = it.size ?? 0;
  const MB = 1024 * 1024;
  const GB = 1024 * 1024 * 1024;
  let val: number;
  let unit: string;
  if (bytes >= GB) {
    val = bytes / GB;
    unit = 'GB';
  } else if (bytes >= MB) {
    val = bytes / MB;
    unit = 'MB';
  } else {
    val = bytes / 1024;
    unit = 'KB';
  }
  const exact = numberFmt.format(bytes) + ' B';
  return <span title={exact}>{`${val.toFixed(1)} ${unit}`}</span>;
}
