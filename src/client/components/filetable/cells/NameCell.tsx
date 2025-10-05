import React from 'react';
import { Anchor, Group } from '@mantine/core';
import { IconFolder, IconFile } from '@tabler/icons-react';
import type { FsItem } from '../../../core/types';
import { SymlinkBadge } from '../SymlinkBadge';

export function NameCell(props: {
  it: FsItem & { name: string };
  idx: number;
  isSymlink: boolean;
  isBroken?: boolean;
  isUnsafe?: boolean;
  onItemClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
}) {
  const { it, idx, isSymlink, isBroken, isUnsafe, onItemClick, onItemDoubleClick } = props;
  return (
    <Group gap={6} wrap="nowrap">
      {it.isDir ? <IconFolder size={18} /> : <IconFile size={18} />}
      <Anchor
        role="button"
        onClick={isSymlink ? undefined : (e: React.MouseEvent) => onItemClick(it, idx, e)}
        onDoubleClick={
          isSymlink
            ? undefined
            : (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                onItemDoubleClick(it, idx, e);
              }
        }
        data-testid="item-open"
        style={{
          cursor: isSymlink ? 'default' : 'pointer',
          textDecoration: isSymlink ? 'none' : undefined,
        }}
      >
        {it.name}
      </Anchor>
      {isSymlink && <SymlinkBadge isBroken={isBroken} isUnsafe={isUnsafe} />}
    </Group>
  );
}
