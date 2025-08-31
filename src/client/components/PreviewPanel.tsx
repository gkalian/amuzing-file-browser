// File preview panel: renders images with meta or shows inline text preview
import { Box, Group, Paper, Text, Code, ActionIcon } from '@mantine/core';
import { api } from '../services/apiClient';
import type { FsItem } from '../core/types';
import React, { memo, useState, useCallback } from 'react';
import { formatBytes } from '../core/utils';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';

function PreviewPanelBase({ item, onDeselect }: { item: FsItem | null; onDeselect?: () => void }) {
  const { t } = useTranslation();
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  if (!item) return <Text c="dimmed">{t('preview.selectFile', { defaultValue: 'Select a file to preview' })}</Text>;
  if (item.isDir) return <Text c="dimmed">{t('preview.folder', { defaultValue: 'Folder' })}</Text>;
  if ((item.mime || '').startsWith('image/')) {
    const onImgLoad = useCallback<React.ReactEventHandler<HTMLImageElement>>((e) => {
      const img = e.currentTarget;
      const next = { w: img.naturalWidth, h: img.naturalHeight };
      setDims((prev) => (prev && prev.w === next.w && prev.h === next.h ? prev : next));
    }, []);
    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Group justify="flex-end" gap={4}>
          {onDeselect && (
            <ActionIcon variant="light" aria-label={t('preview.deselect', { defaultValue: 'Deselect' })} onClick={onDeselect}>
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>
        <Box style={{ flex: 1, overflow: 'auto' }}>
          <img
            src={api.previewUrl(item.path)}
            alt={item.name}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            onLoad={onImgLoad}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, display: 'block' }}
          />
          <Paper withBorder p="sm" mt="sm" radius="md" data-testid="image-meta">
            <Group gap="md" wrap="wrap">
              <Text size="sm">
                <Text span c="dimmed">{t('preview.labels.name', { defaultValue: 'Name:' })}</Text>{' '}
                <Code style={{ fontSize: 'inherit' }}>{item.name}</Code>
              </Text>
              {dims && (
                <Text size="sm">
                  <Text span c="dimmed">{t('preview.labels.dimensions', { defaultValue: 'Dimensions:' })}</Text>{' '}
                  <Code style={{ fontSize: 'inherit' }}>
                    {dims.w} × {dims.h}px
                  </Code>
                </Text>
              )}
              {typeof item.size === 'number' && (
                <Text size="sm">
                  <Text span c="dimmed">{t('preview.labels.size', { defaultValue: 'Size:' })}</Text>{' '}
                  <Code style={{ fontSize: 'inherit' }}>{formatBytes(item.size)}</Code>
                </Text>
              )}
              {item.mime && (
                <Text size="sm">
                  <Text span c="dimmed">{t('preview.labels.type', { defaultValue: 'Type:' })}</Text>{' '}
                  <Code style={{ fontSize: 'inherit' }}>{item.mime}</Code>
                </Text>
              )}
              <Text size="sm">
                <Text span c="dimmed">{t('preview.labels.modified', { defaultValue: 'Modified:' })}</Text>{' '}
                <Code style={{ fontSize: 'inherit' }}>{new Date(item.mtimeMs).toLocaleString()}</Code>
              </Text>
            </Group>
          </Paper>
        </Box>
      </Box>
    );
  }
  if (
    (item.mime || '').startsWith('text/') ||
    ['application/json', 'application/xml'].includes(item.mime || '')
  ) {
    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Group justify="flex-end" gap={4}>
          {onDeselect && (
            <ActionIcon variant="light" aria-label={t('preview.deselect', { defaultValue: 'Deselect' })} onClick={onDeselect}>
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>
        <iframe
          title={t('preview.textPreview', { defaultValue: 'Text preview' })}
          src={api.previewUrl(item.path)}
          loading="lazy"
          style={{ width: '100%', height: '100%', border: '1px solid #eee' }}
        />
      </Box>
    );
  }
  return <Text c="dimmed">{t('preview.noPreview', { defaultValue: 'No preview available' })}</Text>;
}

export const PreviewPanel = memo(PreviewPanelBase, (prev, next) => {
  // Re-render only if the selected item's path or mime changed
  const p = prev.item,
    n = next.item;
  if (p === n) return true;
  if (!p || !n) return p === n;
  return p.path === n.path && (p.mime || '') === (n.mime || '');
});
