// Header toolbar with logo, search, and primary actions (upload, new folder, settings)
import React, { memo, useRef } from 'react';
import { Group, Anchor, Button, FileButton, TextInput, ActionIcon } from '@mantine/core';
import { IconUpload, IconPlus, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type Props = {
  search: string;
  setSearch: (v: string) => void;
  onUpload: (files: File[]) => void;
  onNewFolder: () => void;
  onOpenSettings: () => void;
  onLogoClick: () => void;
  progressSlot?: React.ReactNode;
  theme: 'light' | 'dark';
};

function HeaderBarBase({
  search,
  setSearch,
  onUpload,
  onNewFolder,
  onOpenSettings,
  onLogoClick,
  progressSlot,
  theme,
}: Props) {
  const { t } = useTranslation();
  const logoSrc = theme === 'dark' ? '/document-light.png' : '/document-dark.png';
  const resetRef = useRef<() => void>(null);
  return (
    <Group justify="space-between" px="md" h="100%">
      <Group wrap="nowrap" gap="md">
        <Anchor data-testid="logo" onClick={onLogoClick} style={{ lineHeight: 0, display: 'flex', alignItems: 'center' }}>
          <picture>
            <img
              key={theme}
              src={logoSrc}
              alt={t('app.title', { defaultValue: 'Amuzing File Browser' })}
              style={{ display: 'block', height: 24 }}
            />
          </picture>
        </Anchor>
        <TextInput
          size="xs"
          placeholder={t('search.placeholder', { defaultValue: 'Search' })}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={260}
          data-testid="search-input"
          rightSection={
            search ? (
              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={() => setSearch('')}
                aria-label={t('aria.clear', { defaultValue: 'clear' })}
                data-testid="search-clear"
              >
                <IconX size={12} />
              </ActionIcon>
            ) : undefined
          }
        />
      </Group>
      {progressSlot}
      <Group>
        <FileButton multiple onChange={(files) => { onUpload(files as File[]); resetRef.current?.(); }} resetRef={resetRef}>
          {(props) => (
            <Button
              {...props}
              variant="default"
              size="xs"
              leftSection={<IconUpload size={16} />}
              data-testid="btn-upload"
            >
              {t('header.upload', { defaultValue: 'Upload' })}
            </Button>
          )}
        </FileButton>
        <Button
          variant="default"
          size="xs"
          leftSection={<IconPlus size={16} />}
          onClick={onNewFolder}
          data-testid="btn-new-folder"
        >
          {t('header.newFolder', { defaultValue: 'New folder' })}
        </Button>
        <Button variant="default" size="xs" onClick={onOpenSettings} data-testid="btn-settings">
          {t('header.settings', { defaultValue: 'Settings' })}
        </Button>
      </Group>
    </Group>
  );
}
export const HeaderBar = memo(HeaderBarBase);
