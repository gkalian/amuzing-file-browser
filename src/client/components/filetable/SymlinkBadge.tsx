import React from 'react';
import { Badge, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function SymlinkBadge(props: { isBroken?: boolean; isUnsafe?: boolean }) {
  const { isBroken, isUnsafe } = props;
  const { t } = useTranslation();
  const tooltip = isBroken
    ? t('table.tooltips.symlinkBroken', { defaultValue: 'Broken symbolic link' })
    : isUnsafe
      ? t('table.tooltips.symlinkUnsafe', {
          defaultValue: 'Unsafe symbolic link (points outside root)',
        })
      : undefined;
  return (
    <Tooltip label={tooltip} disabled={!tooltip}>
      <Badge size="xs" variant="light" color={isBroken ? 'red' : isUnsafe ? 'orange' : 'blue'}>
        {t('table.badges.symlink', { defaultValue: 'symlink' })}
      </Badge>
    </Tooltip>
  );
}
