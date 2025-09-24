// Virtualized file table listing with actions (open, rename, link, delete)
import React, { memo, useCallback, useMemo } from 'react';
import { Anchor, Group, Table, ActionIcon, Badge, Tooltip } from '@mantine/core';
import { IconFolder, IconFile, IconDownload, IconLink } from '@tabler/icons-react';
import { api } from '../../services/apiClient';
import type { FsItem } from '../../core/types';
import { useTranslation } from 'react-i18next';
import { notifySuccess, notifyError } from '../../core/notify';
import { TableVirtuoso } from 'react-virtuoso';

type Item = FsItem & { displaySize?: string; displayMtime?: string };
type Props = {
  items: Item[];
  onItemClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
  onItemDoubleClick: (item: FsItem, index: number, e: React.MouseEvent) => void;
  selectedPaths: Set<string>;
};

// Hoisted Virtuoso components to avoid re-creating them on each render
const VirtTable = (props: any) => <Table {...props} highlightOnHover stickyHeader />;
const VirtTableHead = Table.Thead;
const VirtTableRow = Table.Tr as any;
const VirtTableBody = (props: any) => <Table.Tbody {...props} data-testid="table-body" />;

function FileTableBase({ items, onItemClick, onItemDoubleClick, selectedPaths }: Props) {
  const { t } = useTranslation();
  const numberFmt = useMemo(() => new Intl.NumberFormat(), []);
  // Memoized header and row renderer to minimize allocations
  const headerContent = useCallback(
    () => (
      <Table.Tr>
        <Table.Th>{t('table.headers.name', { defaultValue: 'Name' })}</Table.Th>
        <Table.Th>{t('table.headers.size', { defaultValue: 'Size' })}</Table.Th>
        <Table.Th>{t('table.headers.modified', { defaultValue: 'Modified' })}</Table.Th>
        <Table.Th style={{ width: 220 }}></Table.Th>
      </Table.Tr>
    ),
    [t]
  );

  const onGetLink = useCallback(
    async (it: Item) => {
      const url = await api.publicFileUrl(it.path);
      try {
        await navigator.clipboard.writeText(url);
        notifySuccess(t('notifications.linkCopied', { defaultValue: 'Link copied: {{url}}', url }));
      } catch (e: any) {
        notifyError(
          t('notifications.copyLinkFailed', { defaultValue: 'Failed to copy link' }) +
            (e?.message ? `: ${e.message}` : ''),
          t('notifications.copyLinkFailed', { defaultValue: 'Failed to copy link' })
        );
      }
    },
    [t]
  );

  const itemContent = useCallback(
    (idx: number, it: Item) => {
      const isSelected = selectedPaths.has(it.path);
      const selStyle = isSelected
        ? { background: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-4))' }
        : undefined;
      const isSymlink = it.isSymlink;
      const isBroken = it.isBroken;
      const isUnsafe = it.isUnsafe;

      // Determine tooltip for symlink badge
      const symlinkTooltip = isBroken
        ? t('table.tooltips.symlinkBroken', { defaultValue: 'Broken symbolic link' })
        : isUnsafe
          ? t('table.tooltips.symlinkUnsafe', {
              defaultValue: 'Unsafe symbolic link (points outside root)',
            })
          : undefined;

      return (
        <>
          <Table.Td
            style={{ cursor: isSymlink ? 'default' : 'pointer', ...selStyle }}
            data-selected={isSelected || undefined}
            onClick={(e: React.MouseEvent) => onItemClick(it, idx, e)}
            onDoubleClick={
              isSymlink ? undefined : (e: React.MouseEvent) => onItemDoubleClick(it, idx, e)
            }
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
              {it.isDir ? <IconFolder size={18} /> : <IconFile size={18} />}
              <Anchor
                onClick={isSymlink ? undefined : (e: any) => onItemClick(it, idx, e)}
                onDoubleClick={isSymlink ? undefined : (e: any) => onItemDoubleClick(it, idx, e)}
                data-testid="item-open"
                style={{
                  cursor: isSymlink ? 'default' : 'pointer',
                  textDecoration: isSymlink ? 'none' : undefined,
                }}
              >
                {it.name}
              </Anchor>
              {isSymlink && (
                <Tooltip label={symlinkTooltip} disabled={!symlinkTooltip}>
                  <Badge
                    size="xs"
                    variant="light"
                    color={isBroken ? 'red' : isUnsafe ? 'orange' : 'blue'}
                  >
                    {t('table.badges.symlink', { defaultValue: 'symlink' })}
                  </Badge>
                </Tooltip>
              )}
            </Group>
          </Table.Td>
          <Table.Td
            style={{ cursor: isSymlink ? 'default' : 'pointer', ...selStyle }}
            onClick={(e: React.MouseEvent) => onItemClick(it, idx, e)}
            onDoubleClick={
              isSymlink ? undefined : (e: React.MouseEvent) => onItemDoubleClick(it, idx, e)
            }
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
            {it.isDir ? '-' : (it.displaySize ?? numberFmt.format(it.size))}
          </Table.Td>
          <Table.Td
            style={{ cursor: isSymlink ? 'default' : 'pointer', ...selStyle }}
            onClick={(e: React.MouseEvent) => onItemClick(it, idx, e)}
            onDoubleClick={
              isSymlink ? undefined : (e: React.MouseEvent) => onItemDoubleClick(it, idx, e)
            }
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
            {it.displayMtime ?? new Date(it.mtimeMs).toLocaleString()}
          </Table.Td>
          <Table.Td
            style={{ ...selStyle, textAlign: 'right' }}
            onClick={(e: React.MouseEvent) => onItemClick(it, idx, e)}
            onDoubleClick={
              isSymlink ? undefined : (e: React.MouseEvent) => onItemDoubleClick(it, idx, e)
            }
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
            <Group gap={4} justify="flex-end">
              {!it.isDir && !isSymlink && (
                <ActionIcon
                  component="a"
                  href={api.downloadUrl(it.path)}
                  variant="light"
                  aria-label={t('table.actions.download', { defaultValue: 'Download' })}
                  title={t('table.actions.download', { defaultValue: 'Download' })}
                  data-testid="action-download"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDownload size={16} />
                </ActionIcon>
              )}
              {!it.isDir && !isSymlink && (
                <ActionIcon
                  variant="light"
                  aria-label={t('table.actions.copyLink', { defaultValue: 'Copy permanent link' })}
                  title={t('table.actions.copyLink', { defaultValue: 'Copy permanent link' })}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGetLink(it);
                  }}
                  data-testid="action-get-link"
                >
                  <IconLink size={16} />
                </ActionIcon>
              )}
            </Group>
          </Table.Td>
        </>
      );
    },
    [numberFmt, onItemClick, onGetLink, onItemDoubleClick, selectedPaths, t]
  );

  return (
    <TableVirtuoso<Item>
      data={items}
      style={{ height: '100%' }}
      computeItemKey={(_, it) => it.path}
      increaseViewportBy={{ top: 200, bottom: 400 }}
      components={{
        Table: VirtTable,
        TableHead: VirtTableHead,
        TableRow: VirtTableRow,
        TableBody: VirtTableBody,
      }}
      fixedHeaderContent={headerContent}
      itemContent={itemContent}
    />
  );
}

export const FileTable = memo(FileTableBase);
