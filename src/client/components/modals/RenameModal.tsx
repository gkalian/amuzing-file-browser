// Modal dialog to rename a selected file or folder
import React, { memo } from 'react';
import { Button, Group, Modal, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  opened: boolean;
  name: string;
  setName: (v: string) => void;
  onRename: () => void;
  onClose: () => void;
};

function RenameModalBase({ opened, name, setName, onRename, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('table.aria.rename', { defaultValue: 'Rename' })}
      centered
    >
      <Group>
        <TextInput
          placeholder={t('rename.placeholder', { defaultValue: 'New name' })}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          autoFocus
        />
        <Button onClick={onRename}>{t('table.aria.rename', { defaultValue: 'Rename' })}</Button>
      </Group>
    </Modal>
  );
}
export const RenameModal = memo(RenameModalBase);
