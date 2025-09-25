import React from 'react';
import { Group, Table } from '@mantine/core';
import type { FsItem } from '../../core/types';
import { useTranslation } from 'react-i18next';
import { NameCell } from './cells/NameCell';
import { SizeCell } from './cells/SizeCell';
import { ModifiedCell } from './cells/ModifiedCell';
import { ActionsCell } from './cells/ActionsCell';

export type FileRowItem = FsItem & { displaySize?: string; displayMtime?: string };

export function FileRow(props: {
  idx: number;
  it: FileRowItem;
  isSelected: boolean;
  selStyle: React.CSSProperties | undefined;
  isRowDragOver: boolean;
  isFolderDnDTarget: boolean;
  numberFmt: Intl.NumberFormat;
  onItemClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
  onDropUpload?: (targetDir: string | null, files: File[]) => void;
  setDragOverPath: (path: string | null) => void;
}) {
  const {
    idx,
    it,
    isSelected,
    selStyle,
    isRowDragOver,
    isFolderDnDTarget,
    numberFmt,
    onItemClick,
    onItemDoubleClick,
    onDropUpload,
    setDragOverPath,
  } = props;
  const { t } = useTranslation();
  const isSymlink = !!it.isSymlink;
  const isBroken = !!it.isBroken;
  const isUnsafe = !!it.isUnsafe;

  return (
    <>
      <Table.Td
        style={{
          cursor: isSymlink ? 'default' : 'pointer',
          ...(selStyle || {}),
          ...(isRowDragOver
            ? {
                boxShadow: 'inset 0 0 0 2px var(--mantine-color-blue-5)',
                borderRadius: 4,
              }
            : {}),
        }}
        data-selected={isSelected || undefined}
        data-dnd-folder={isFolderDnDTarget || undefined}
        onClick={(e: React.MouseEvent) => onItemClick(it, idx, e)}
        onDoubleClick={isSymlink ? undefined : (e: React.MouseEvent) => onItemDoubleClick(it, idx, e)}
        onDragOver={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
          setDragOverPath(it.path);
        }}
        onDragEnter={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          setDragOverPath(it.path);
        }}
        onDragLeave={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          // Do not clear here to avoid flicker when moving between child elements
        }}
        onDrop={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          const files = Array.from(e.dataTransfer.files || []);
          if (!files.length) return;
          setDragOverPath(null);
          onDropUpload && onDropUpload(it.path, files);
        }}
        title={
          isSymlink
            ? undefined
            : it.isDir
              ? t('table.tooltips.openFolder', { defaultValue: 'Double-click to open' })
              : (it.mime || '').startsWith('image/')
                ? t('table.tooltips.selectDeselect', { defaultValue: 'Select/Deselect' })
                : undefined
        }
      >
        <Group gap={6} wrap="nowrap">
          <NameCell
            it={it}
            idx={idx}
            isSymlink={isSymlink}
            isBroken={isBroken}
            isUnsafe={isUnsafe}
            onItemClick={onItemClick}
            onItemDoubleClick={onItemDoubleClick}
          />
        </Group>
      </Table.Td>

      <Table.Td
        style={{
          cursor: isSymlink ? 'default' : 'pointer',
          ...(selStyle || {}),
          ...(isRowDragOver
            ? {
                boxShadow: 'inset 0 0 0 2px var(--mantine-color-blue-5)',
                borderRadius: 4,
              }
            : {}),
        }}
        data-dnd-folder={isFolderDnDTarget || undefined}
        onClick={(e: React.MouseEvent) => onItemClick(it, idx, e)}
        onDoubleClick={isSymlink ? undefined : (e: React.MouseEvent) => onItemDoubleClick(it, idx, e)}
        onDragOver={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
          setDragOverPath(it.path);
        }}
        onDragEnter={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          setDragOverPath(it.path);
        }}
        onDragLeave={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          // Do not clear here to avoid flicker when moving between child elements
        }}
        onDrop={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          const files = Array.from(e.dataTransfer.files || []);
          if (!files.length) return;
          setDragOverPath(null);
          onDropUpload && onDropUpload(it.path, files);
        }}
        title={
          isSymlink
            ? undefined
            : it.isDir
              ? t('table.tooltips.openFolder', { defaultValue: 'Double-click to open' })
              : (it.mime || '').startsWith('image/')
                ? t('table.tooltips.selectDeselect', { defaultValue: 'Select/Deselect' })
                : undefined
        }
      >
        <SizeCell it={it as any} numberFmt={numberFmt} />
      </Table.Td>

      <Table.Td
        style={{
          cursor: isSymlink ? 'default' : 'pointer',
          ...(selStyle || {}),
          ...(isRowDragOver
            ? {
                boxShadow: 'inset 0 0 0 2px var(--mantine-color-blue-5)',
                borderRadius: 4,
              }
            : {}),
        }}
        onClick={(e: React.MouseEvent) => onItemClick(it, idx, e)}
        onDoubleClick={isSymlink ? undefined : (e: React.MouseEvent) => onItemDoubleClick(it, idx, e)}
        onDragOver={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
          setDragOverPath(it.path);
        }}
        onDragEnter={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          setDragOverPath(it.path);
        }}
        onDragLeave={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          // Do not clear here to avoid flicker when moving between child elements
        }}
        onDrop={(e) => {
          if (!isFolderDnDTarget) return;
          e.preventDefault();
          e.stopPropagation();
          const files = Array.from(e.dataTransfer.files || []);
          if (!files.length) return;
          setDragOverPath(null);
          onDropUpload && onDropUpload(it.path, files);
        }}
        title={
          isSymlink
            ? undefined
            : it.isDir
              ? t('table.tooltips.openFolder', { defaultValue: 'Double-click to open' })
              : (it.mime || '').startsWith('image/')
                ? t('table.tooltips.selectDeselect', { defaultValue: 'Select/Deselect' })
                : undefined
        }
      >
        <ModifiedCell it={it as any} />
      </Table.Td>

      <Table.Td
        style={{
          ...(selStyle || {}),
          textAlign: 'right',
          ...(isRowDragOver
            ? {
                boxShadow: 'inset 0 0 0 2px var(--mantine-color-blue-5)',
                borderRadius: 4,
              }
            : {}),
        }}
        onClick={(e: React.MouseEvent) => onItemClick(it, idx, e)}
        onDoubleClick={isSymlink ? undefined : (e: React.MouseEvent) => onItemDoubleClick(it, idx, e)}
        title={
          isSymlink
            ? undefined
            : it.isDir
              ? t('table.tooltips.openFolder', { defaultValue: 'Double-click to open' })
              : (it.mime || '').startsWith('image/')
                ? t('table.tooltips.selectDeselect', { defaultValue: 'Select/Deselect' })
                : undefined
        }
      >
        <ActionsCell it={it} />
      </Table.Td>
    </>
  );
}
