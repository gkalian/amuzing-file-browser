// Bottom statistics and pagination bar for the file list
import React, { memo } from 'react';
import { Box, Group, Pagination, SegmentedControl, Text } from '@mantine/core';
import { formatBytes } from '../core/utils';
import { useTranslation } from 'react-i18next';

type Props = {
  totals: { files: number; dirs: number; size: number };
  pageSize: '25' | '50' | '100';
  setPageSize: (v: '25' | '50' | '100') => void;
  totalPages: number;
  page: number;
  setPage: (v: number) => void;
};

function BottomBarBase({ totals, pageSize, setPageSize, totalPages, page, setPage }: Props) {
  const { t } = useTranslation();
  return (
    <Group
      style={{
        position: 'sticky',
        bottom: 0,
        paddingTop: 8,
        paddingBottom: 8,
        background: 'var(--mantine-color-body)',
        zIndex: 1,
      }}
    >
      <Text size="sm" c="dimmed" data-testid="stats">
        {t('bottom.stats', {
          defaultValue: '{{dirs}} folders • {{files}} files • {{size}} total',
          dirs: totals.dirs,
          files: totals.files,
          size: formatBytes(totals.size),
        })}
      </Text>
      <Box style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
        <Group gap="xs" align="center" data-testid="pager-controls">
          <SegmentedControl
            data={[
              { label: '25', value: '25' },
              { label: '50', value: '50' },
              { label: '100', value: '100' },
            ]}
            value={pageSize}
            onChange={(v) => setPageSize((v as '25' | '50' | '100') || '25')}
            size="xs"
          />
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
        </Group>
      </Box>
    </Group>
  );
}
export const BottomBar = memo(BottomBarBase);
