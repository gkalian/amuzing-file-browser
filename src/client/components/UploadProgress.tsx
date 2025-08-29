// UploadProgress: small inline progress bar to show total upload progress
import { Group, Progress, Text } from '@mantine/core';
import React, { memo } from 'react';

type Props = {
  uploading: boolean;
  uploadedBytes: number;
  totalBytes: number;
};

function UploadProgressBase({ uploading, uploadedBytes, totalBytes }: Props) {
  if (!uploading || totalBytes <= 0) return null;
  const pct = Math.max(0, Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)));
  return (
    <Group gap={8} wrap="nowrap" align="center" style={{ minWidth: 220 }}>
      <Progress value={pct} style={{ width: 160 }} size="sm" aria-label="upload-progress" />
      <Text size="xs" c="dimmed" style={{ width: 40, textAlign: 'right' }}>
        {pct}%
      </Text>
    </Group>
  );
}

export const UploadProgress = memo(UploadProgressBase);
