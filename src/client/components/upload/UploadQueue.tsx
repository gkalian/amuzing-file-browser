// UploadQueue: compact list of currently uploading files with per-file progress
import { Group, Progress, Text, ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
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
  speedBps?: number;
  onCancel?: () => void;
};

function UploadQueueBase({
  uploading,
  items,
  uploadedBytes = 0,
  totalBytes = 0,
  speedBps = 0,
  onCancel,
}: Props) {
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

  const fmtSpeed = (bps: number) => {
    if (!bps || bps <= 0) return '';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    let i = 0;
    let val = bps;
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024;
      i++;
    }
    return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
  };

  return (
    <div style={{ minWidth: 275 }}>
      <Group justify="space-between" align="center" gap={6} mb={2} wrap="nowrap">
        <Text size="xs" truncate="end" title={current.name}>
          {current.name}
        </Text>
        {onCancel && (
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            aria-label="cancel-upload"
            onClick={onCancel}
          >
            <IconX size={12} />
          </ActionIcon>
        )}
      </Group>
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
      {!!speedBps && speedBps > 0 && (
        <Text size="10px" c="dimmed" mt={2} title="upload-speed">
          {fmtSpeed(speedBps)}
        </Text>
      )}
      {current.status === 'error' && current.error && (
        <Text size="xs" c="red">
          {current.error}
        </Text>
      )}
    </div>
  );
}

export const UploadQueue = memo(UploadQueueBase);
