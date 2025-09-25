import React from 'react';
import { ActionIcon, Group } from '@mantine/core';
import { IconDownload, IconLink } from '@tabler/icons-react';
import type { FsItem } from '../../../core/types';
import { useTranslation } from 'react-i18next';
import { api } from '../../../services/apiClient';
import { useGetLink } from '../hooks/useGetLink';

export function ActionsCell(props: { it: FsItem & { path: string; isDir?: boolean; isSymlink?: boolean } }) {
  const { it } = props;
  const { t } = useTranslation();
  const getLink = useGetLink();

  if (it.isDir || it.isSymlink) return null;

  return (
    <Group gap={4} justify="flex-end">
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

      <ActionIcon
        variant="light"
        aria-label={t('table.actions.copyLink', { defaultValue: 'Copy permanent link' })}
        title={t('table.actions.copyLink', { defaultValue: 'Copy permanent link' })}
        onClick={(e) => {
          e.stopPropagation();
          getLink(it.path);
        }}
        data-testid="action-get-link"
      >
        <IconLink size={16} />
      </ActionIcon>
    </Group>
  );
}
