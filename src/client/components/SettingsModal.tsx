// Settings modal: app preferences (root path, upload limit, theme, preview, language)
import React, { memo } from 'react';
import { Box, Modal, SegmentedControl, Switch, Text, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  opened: boolean;
  onClose: () => void;
  cfgRoot: string;
  setCfgRoot: (v: string) => void;
  cfgMaxUpload: number;
  setCfgMaxUpload: (v: number) => void;
  cfgAllowedTypes: string;
  setCfgAllowedTypes: (v: string) => void;
  theme: 'light' | 'dark';
  setTheme: (v: 'light' | 'dark') => void;
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
};

function SettingsModalBase({
  opened,
  onClose,
  cfgRoot,
  setCfgRoot,
  cfgMaxUpload,
  setCfgMaxUpload,
  cfgAllowedTypes,
  setCfgAllowedTypes,
  theme,
  setTheme,
  showPreview,
  setShowPreview,
}: Props) {
  const { t, i18n } = useTranslation();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('settings.title')}
      centered
      data-testid="modal-settings"
    >
      <Box>
        <Text size="sm" mb="xs">
          {t('settings.rootPath')}
        </Text>
        <TextInput
          value={cfgRoot}
          onChange={(e) => setCfgRoot(e.currentTarget.value)}
          placeholder={t('settings.rootPlaceholder', { defaultValue: '/absolute/path' })}
          mb="md"
          data-testid="settings-root"
        />

        <Text size="sm" mb="xs">
          {t('settings.maxUpload')}
        </Text>
        <TextInput
          type="number"
          value={String(cfgMaxUpload)}
          onChange={(e) => setCfgMaxUpload(Number(e.currentTarget.value || 0))}
          mb="md"
          data-testid="settings-maxupload"
        />

        <Text size="sm" mb="xs">
          {t('settings.allowedTypes', { defaultValue: 'Allowed upload formats (comma-separated)' })}
        </Text>
        <TextInput
          value={cfgAllowedTypes}
          onChange={(e) => setCfgAllowedTypes(e.currentTarget.value)}
          placeholder={t('settings.allowedTypesPlaceholder', { defaultValue: 'e.g. jpg,png,webp' })}
          mb="md"
          data-testid="settings-allowed-types"
        />

        <Text size="sm" mb="xs">
          {t('settings.theme')}
        </Text>
        <SegmentedControl
          data={[
            { label: t('settings.themeLight', { defaultValue: 'Light' }), value: 'light' },
            { label: t('settings.themeDark', { defaultValue: 'Dark' }), value: 'dark' },
          ]}
          value={theme}
          onChange={(v) => setTheme((v as 'light' | 'dark') || 'light')}
          data-testid="settings-theme"
        />

        <Box mt="md">
          <Switch
            label={t('settings.preview')}
            checked={showPreview}
            onChange={(e) => setShowPreview(e.currentTarget.checked)}
            data-testid="settings-preview"
          />
        </Box>

        <Text size="sm" mt="md" mb="xs">
          {t('settings.lang')}
        </Text>
        <SegmentedControl
          data={[
            { label: 'EN', value: 'en' },
            { label: 'RU', value: 'ru' },
          ]}
          value={(i18n.language || 'en').startsWith('ru') ? 'ru' : 'en'}
          onChange={(lng) => i18n.changeLanguage(lng)}
          data-testid="settings-language"
        />

        {/* Autosave enabled; no explicit Save button */}
      </Box>
    </Modal>
  );
}

export const SettingsModal = memo(SettingsModalBase);
