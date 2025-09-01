// UploadQueue: compact list of currently uploading files with per-file progress
import { Group, Progress, Text } from '@mantine/core';
import React, { memo } from 'react';

export type UploadItem = {
  name: string;
  size: number;
  uploaded: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

type Props = {
  uploading: boolean;
  items: UploadItem[];
  uploadedBytes?: number;
  totalBytes?: number;
};

function UploadQueueBase({ uploading, items, uploadedBytes = 0, totalBytes = 0 }: Props) {
  if (!uploading || !items?.length) return null;

  // Show only the current item: first 'uploading', otherwise first 'pending'
  const current =
    items.find((i) => i.status === 'uploading') || items.find((i) => i.status === 'pending');
  if (!current) return null;

  const pctTotal =
    totalBytes > 0 ? Math.round((Math.min(uploadedBytes, totalBytes) / totalBytes) * 100) : null;
  const pct =
    pctTotal != null
      ? pctTotal
      : current.size > 0
        ? Math.round((Math.min(current.uploaded, current.size) / current.size) * 100)
        : 0;
  const color = current.status === 'error' ? 'red' : current.status === 'done' ? 'green' : 'blue';

  return (
    <div style={{ minWidth: 250 }}>
      <Text size="xs" truncate="end" title={current.name} mb={4}>
        {current.name}
      </Text>
      <Group gap={6} justify="space-between" wrap="nowrap" align="center">
        <Progress
          value={current.status === 'error' ? 100 : pct}
          color={color}
          size="xs"
          style={{ width: 180 }}
        />
        <Text size="xs" c="dimmed" style={{ width: 40, textAlign: 'right' }}>
          {current.status === 'done' ? '100%' : `${pct}%`}
        </Text>
      </Group>
      {current.status === 'error' && current.error && (
        <Text size="xs" c="red">
          {current.error}
        </Text>
      )}
    </div>
  );
}

export const UploadQueue = memo(UploadQueueBase);
