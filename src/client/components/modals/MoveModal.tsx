// Modal dialog to move selected files to a destination directory
import React, { memo } from 'react';
import { Button, Group, Modal, Autocomplete } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  opened: boolean;
  dest: string;
  setDest: (v: string) => void;
  options: string[];
  onMove: () => void;
  onClose: () => void;
};

function MoveModalBase({ opened, dest, setDest, options, onMove, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal opened={opened} onClose={onClose} title={t('bulk.moveTitle', { defaultValue: 'Move selected files' })} centered>
      <Group align="end" wrap="nowrap">
        <Autocomplete
          style={{ flex: 1 }}
          label={t('bulk.destination', { defaultValue: 'Destination folder' })}
          placeholder={t('bulk.movePlaceholder', { defaultValue: 'Choose or type folder path' })}
          data={options}
          value={dest}
          onChange={(v) => setDest(v || '')}
        />
        <Button onClick={onMove}>{t('bulk.move', { defaultValue: 'Move' })}</Button>
      </Group>
    </Modal>
  );
}
export const MoveModal = memo(MoveModalBase);
