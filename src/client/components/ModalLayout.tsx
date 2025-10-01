// ModalLayout: централизованный рендер модальных окон приложения
import React, { memo } from 'react';
import { MkdirModal } from './modals/MkdirModal';
import { RenameModal } from './modals/RenameModal';
import { SettingsModal } from './modals/SettingsModal';
import { MoveModal } from './modals/MoveModal';

export const ModalLayout = memo(function ModalLayout(props: {
  mkdir: {
    opened: boolean;
    name: string;
    setName: (v: string) => void;
    onCreate: () => void;
    onClose: () => void;
  };
  rename: {
    opened: boolean;
    name: string;
    setName: (v: string) => void;
    onRename: () => void;
    onClose: () => void;
  };
  settings: {
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
  move: {
    opened: boolean;
    dest: string;
    setDest: (v: string) => void;
    options: string[];
    onMove: () => void;
    onClose: () => void;
  };
}) {
  const { mkdir, rename, settings, move } = props;
  return (
    <>
      <MkdirModal
        opened={mkdir.opened}
        name={mkdir.name}
        setName={mkdir.setName}
        onCreate={mkdir.onCreate}
        onClose={mkdir.onClose}
      />

      <RenameModal
        opened={rename.opened}
        name={rename.name}
        setName={rename.setName}
        onRename={rename.onRename}
        onClose={rename.onClose}
      />

      <SettingsModal
        opened={settings.opened}
        onClose={settings.onClose}
        cfgRoot={settings.cfgRoot}
        setCfgRoot={settings.setCfgRoot}
        cfgMaxUpload={settings.cfgMaxUpload}
        setCfgMaxUpload={settings.setCfgMaxUpload}
        cfgAllowedTypes={settings.cfgAllowedTypes}
        setCfgAllowedTypes={settings.setCfgAllowedTypes}
        theme={settings.theme}
        setTheme={settings.setTheme}
        showPreview={settings.showPreview}
        setShowPreview={settings.setShowPreview}
      />

      <MoveModal
        opened={move.opened}
        dest={move.dest}
        setDest={move.setDest}
        options={move.options}
        onMove={move.onMove}
        onClose={move.onClose}
      />
    </>
  );
});
