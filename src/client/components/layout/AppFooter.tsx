// Footer component: shows app copyright and version
import React, { memo } from 'react';
import { Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = { version: string };

// Computed once at module load: keeps render pure
const CURRENT_YEAR = new Date().getFullYear();

function AppFooterBase({ version }: Props) {
  const { t } = useTranslation();
  return (
    <Group h="100%" px="md" justify="center" style={{ alignItems: 'center' }}>
      <Text size="sm">
        {t('footer.version', {
          defaultValue: 'Amuzing File Browser {{year}}, ver. {{version}}',
          year: CURRENT_YEAR,
          version,
        })}
      </Text>
    </Group>
  );
}

export const AppFooter = memo(AppFooterBase);
