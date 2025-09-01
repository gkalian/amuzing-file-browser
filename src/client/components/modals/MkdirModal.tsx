// Modal to create a new folder in the current directory
import React, { memo } from 'react';
import { Button, Group, Modal, TextInput } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type Props = {
  opened: boolean;
  name: string;
  setName: (v: string) => void;
  onCreate: () => void;
  onClose: () => void;
};

function MkdirModalBase({ opened, name, setName, onCreate, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('mkdir.title', { defaultValue: 'Create folder' })}
      centered
    >
      <Group>
        <TextInput
          placeholder={t('mkdir.placeholder', { defaultValue: 'Folder name' })}
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Button onClick={onCreate}>{t('mkdir.create', { defaultValue: 'Create' })}</Button>
      </Group>
    </Modal>
  );
}

export const MkdirModal = memo(MkdirModalBase);
