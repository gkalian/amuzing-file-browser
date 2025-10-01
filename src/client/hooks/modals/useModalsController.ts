// Hook: centralizes state and handlers for Mkdir/Rename/Move/Settings modals
import { useCallback, useState } from 'react';
import type { FsItem } from '../../core/types';

export function useModalsController(params: {
  onMkdir: (name: string) => Promise<void> | void;
  onRename: (target: FsItem, name: string) => Promise<void> | void;
  onMove: (dest: string) => Promise<void> | void;
  afterRenameSuccess?: (target: FsItem) => void; // e.g., clear selection
  settings: {
    opened: boolean;
    open: () => void;
    close: () => void;
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
}) {
  const { onMkdir, onRename, onMove, afterRenameSuccess, settings } = params;

  // Mkdir
  const [mkdirOpen, setMkdirOpen] = useState(false);
  const [mkdirName, setMkdirName] = useState('');
  const handleMkdir = useCallback(async () => {
    const name = mkdirName.trim();
    if (!name) return;
    await Promise.resolve(onMkdir(name));
    setMkdirName('');
    setMkdirOpen(false);
  }, [mkdirName, onMkdir]);

  // Rename
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameTarget, setRenameTarget] = useState<FsItem | null>(null);
  const openRename = useCallback((target: FsItem) => {
    setRenameTarget(target);
    setRenameName(target.name);
    setRenameOpen(true);
  }, []);
  const handleRename = useCallback(async () => {
    if (!renameTarget) return;
    const name = renameName.trim();
    if (!name) return;
    await Promise.resolve(onRename(renameTarget, name));
    setRenameOpen(false);
    if (afterRenameSuccess) afterRenameSuccess(renameTarget);
  }, [renameTarget, renameName, onRename, afterRenameSuccess]);

  // Move
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDest, setMoveDest] = useState('');
  const openMove = useCallback((initialDest: string) => {
    setMoveDest(initialDest);
    setMoveOpen(true);
  }, []);
  const handleMove = useCallback(async () => {
    const dest = moveDest.trim();
    if (!dest) return;
    await Promise.resolve(onMove(dest));
    setMoveOpen(false);
    setMoveDest('');
  }, [moveDest, onMove]);

  // Settings: use passed controller (already managed outside)
  const openSettings = settings.open;
  const closeSettings = settings.close;

  return {
    mkdir: {
      opened: mkdirOpen,
      name: mkdirName,
      setName: setMkdirName,
      onCreate: handleMkdir,
      onClose: () => setMkdirOpen(false),
    },
    rename: {
      opened: renameOpen,
      name: renameName,
      setName: setRenameName,
      onRename: handleRename,
      onClose: () => setRenameOpen(false),
    },
    move: {
      opened: moveOpen,
      dest: moveDest,
      setDest: setMoveDest,
      onMove: handleMove,
      onClose: () => setMoveOpen(false),
    },
    settings: {
      opened: settings.opened,
      onClose: closeSettings,
      cfgRoot: settings.cfgRoot,
      setCfgRoot: settings.setCfgRoot,
      cfgMaxUpload: settings.cfgMaxUpload,
      setCfgMaxUpload: settings.setCfgMaxUpload,
      cfgAllowedTypes: settings.cfgAllowedTypes,
      setCfgAllowedTypes: settings.setCfgAllowedTypes,
      theme: settings.theme,
      setTheme: settings.setTheme,
      showPreview: settings.showPreview,
      setShowPreview: settings.setShowPreview,
    },
    api: {
      openMkdir: () => setMkdirOpen(true),
      openRename,
      openMove,
      openSettings,
    },
  } as const;
}
