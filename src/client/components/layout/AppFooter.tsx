// Footer component: shows app copyright and version
import React, { memo } from 'react';
import { Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = { version: string };

function AppFooterBase({ version }: Props) {
  const { t } = useTranslation();
  return (
    <Group h="100%" px="md" justify="center" style={{ alignItems: 'center' }}>
      <Text size="sm">
        {t('footer.version', {
          defaultValue: 'Amuzing File Browser {{year}}, ver. {{version}}',
          year: new Date().getFullYear(),
          version,
        })}
      </Text>
    </Group>
  );
}

export const AppFooter = memo(AppFooterBase);
