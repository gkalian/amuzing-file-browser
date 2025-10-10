// App root component: orchestrates layout, state, API calls, and wiring between UI parts
import { memo, useCallback, useMemo, useState } from 'react';
import { Group, Button } from '@mantine/core';
import pkg from '../../package.json';
import { parentPath } from './core/utils';

import { FileBrowserPane } from './components/browser/FileBrowserPane';
import { BottomBar } from './components/layout/BottomBar';
import { UploadQueue } from './components/upload/UploadQueue';
import { useTranslation } from 'react-i18next';
// internal hooks
import { useFileList } from './hooks/data/useFileList';
import { useSearch } from './hooks/navigation/useSearch';
import { useSplitPane } from './hooks/ui/useSplitPane';
import { useIsNarrow } from './hooks/ui/useIsNarrow';
import { useBreadcrumbs } from './hooks/navigation/useBreadcrumbs';
import { useUploads } from './hooks/uploads/useUploads';
import { useSettings } from './hooks/ui/useSettings';
import { useListingModel } from './hooks/browser/useListingModel';
import { useFsActions } from './hooks/data/useFsActions';
import { useSelection } from './hooks/selection/useSelection';
import { useMoveOptions } from './hooks/selection/useMoveOptions';
import { useThemeSync } from './hooks/ui/useThemeSync';
import { useKeyboardShortcuts } from './hooks/browser/useKeyboardShortcuts';
import { usePreviewSetting } from './hooks/ui/usePreviewSetting';
import { AppLayout } from './components/AppLayout';
import { ModalLayout } from './components/ModalLayout';
import { useModalsController } from './hooks/modals/useModalsController';

function AppBase() {
  // no direct i18n usage in this component
  const { t } = useTranslation();
  const DEFAULT_ALLOWED_TYPES = 'jpg, jpeg, gif, png, webp, 7z, zip';
  const [cwd, setCwd] = useState<string>('/');
  // selection state handled via useSelection hook
  // file list
  const { items, loading, loadList } = useFileList(cwd);
  // search
  const { search, setSearchTransition, debouncedSearch } = useSearch('');

  // listing model (filter + sort + pagination + totals)
  const listing = useListingModel({ items, search: debouncedSearch, initialPageSize: '25' });

  // settings
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    cfgRoot,
    setCfgRoot,
    cfgMaxUpload,
    setCfgMaxUpload,
    cfgAllowedTypes,
    setCfgAllowedTypes,
    cfgTheme,
    setCfgTheme,
  } = useSettings({ defaultAllowedTypes: DEFAULT_ALLOWED_TYPES, t });
  // theme is now loaded/saved via useSettings (server persistence)
  const theme = cfgTheme;
  const setTheme = setCfgTheme;

  // preview flag persisted via hook
  const { showPreview, setShowPreview } = usePreviewSetting(true);

  // split sizes (percentage of table width)
  const { split, setDragging, splitRef } = useSplitPane(70, 67, 80);

  // viewport width tracking to disable preview under 700px
  const isNarrow = useIsNarrow(700);

  // bulk operations
  const [bulkWorking, setBulkWorking] = useState(false);
  // move modal state handled by useModalsController

  // Sync theme attribute
  useThemeSync(theme);

  const crumbs = useBreadcrumbs(cwd, '..');
  // uploads hook (keeps this file slim)
  const {
    uploading,
    uploadedBytes,
    totalBytes,
    uploadItems,
    uploadSpeedBps,
    cancelUploads,
    handleUpload,
    handleUploadTo,
  } = useUploads({
    cwd,
    allowedTypes: cfgAllowedTypes,
    t,
    loadList,
  });

  // unified filesystem actions (mkdir, rename, bulkDelete, bulkMove)
  const { mkdir, rename, bulkDelete, bulkMove } = useFsActions({ cwd, items, loadList, t });

  const {
    paged,
    totals,
    totalPages,
    sortField,
    sortDir,
    onSort,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = listing as any;

  // selection logic extracted to hook
  const { selectedPaths, setSelectedPaths, onItemClick, onItemDoubleClick, clearSelection } =
    useSelection({
      paged: paged as any,
      cwd,
      onOpenDir: (path) => setCwd(path),
    });

  // bulk actions are provided by useFsActions (above)

  // Modals controller: centralizes Mkdir/Rename/Move/Settings
  const modals = useModalsController({
    onMkdir: async (name) => {
      await mkdir(name).catch(() => {});
    },
    onRename: async (target, name) => {
      await rename(target, name).catch(() => {});
    },
    onMove: async (dest) => {
      if (!selectedPaths.size) return;
      setBulkWorking(true);
      try {
        await bulkMove(selectedPaths, dest);
        clearSelection();
      } finally {
        setBulkWorking(false);
      }
    },
    afterRenameSuccess: (target) => {
      setSelectedPaths((prev) => {
        const next = new Set(prev);
        next.delete(target.path);
        return next;
      });
    },
    settings: {
      opened: settingsOpen,
      open: () => setSettingsOpen(true),
      close: () => setSettingsOpen(false),
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
    },
  });

  // bulk: delete selected files
  const handleBulkDelete = useCallback(async () => {
    if (!selectedPaths.size) return;
    setBulkWorking(true);
    try {
      await bulkDelete(selectedPaths);
      clearSelection();
    } finally {
      setBulkWorking(false);
    }
  }, [selectedPaths, bulkDelete, clearSelection]);

  // bulk move handled inside modals controller (move.onMove)

  // destination options for move
  const moveOptions = useMoveOptions(cwd, items, modals.move.dest);

  // Rename selected (used by keyboard shortcuts and toolbar)
  const onRenameSelected = useCallback(() => {
    if (selectedPaths.size !== 1) return;
    const p = Array.from(selectedPaths)[0];
    const it = (items || []).find((i) => i.path === p);
    if (!it) return;
    modals.api.openRename(it);
  }, [selectedPaths, items, modals.api]);

  // Unified keyboard shortcuts: arrows, Enter, Delete, Backspace, F2
  useKeyboardShortcuts({
    items: paged as any,
    selectedPaths,
    setSelectedPaths,
    onOpenDir: (path) => setCwd(path),
    onGoUp: () => setCwd(parentPath(cwd)),
    onDelete: handleBulkDelete,
    onRename: onRenameSelected,
    enabled: true,
  });

  // Drag-and-drop destination routing
  const onDropUpload = useCallback(
    (targetDir: string | null, files: File[]) => {
      if (!files || files.length === 0) return;
      if (targetDir && targetDir !== cwd) {
        return void handleUploadTo(targetDir, files);
      }
      return void handleUpload(files);
    },
    [cwd, handleUpload, handleUploadTo]
  );

  return (
    <>
      <AppLayout
        theme={theme}
        header={{
          search,
          setSearch: setSearchTransition,
          onUpload: (files) => handleUpload(files),
          onNewFolder: () => modals.api.openMkdir(),
          onOpenSettings: () => modals.api.openSettings(),
          onLogoClick: () => setCwd('/'),
          progressSlot: (
            <UploadQueue
              uploading={uploading}
              items={uploadItems}
              uploadedBytes={uploadedBytes}
              totalBytes={totalBytes}
              speedBps={uploadSpeedBps}
              onCancel={cancelUploads}
            />
          ),
        }}
        breadcrumbs={{
          crumbs,
          cwd,
          onCrumbClick: (p) => setCwd(p),
          onUp: () => setCwd(parentPath(cwd)),
          rightActions:
            selectedPaths.size > 0 ? (
              <Group gap="xs" wrap="nowrap">
                <Button
                  size="xs"
                  variant="light"
                  onClick={onRenameSelected}
                  disabled={selectedPaths.size !== 1 || bulkWorking}
                >
                  Rename
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  onClick={handleBulkDelete}
                  disabled={bulkWorking}
                >
                  Delete
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  onClick={() => modals.api.openMove(cwd)}
                  disabled={bulkWorking}
                >
                  Move
                </Button>
                <Button size="xs" variant="subtle" onClick={clearSelection} disabled={bulkWorking}>
                  Clear
                </Button>
              </Group>
            ) : undefined,
        }}
        main={{
          content: (
            <FileBrowserPane
              items={paged as any}
              loading={loading}
              selectedPaths={selectedPaths}
              onItemClick={onItemClick}
              onItemDoubleClick={onItemDoubleClick}
              onDeselect={() => {
                clearSelection();
              }}
              showPreview={showPreview}
              isNarrow={isNarrow}
              split={split}
              setDragging={setDragging}
              splitRef={splitRef}
              onDropUpload={onDropUpload}
              sortField={sortField}
              sortDir={sortDir}
              onSort={onSort}
            />
          ),
          bottomBar: (
            <BottomBar
              totals={totals}
              pageSize={pageSize}
              setPageSize={(v) => {
                setPageSize(v);
                setPage(1);
                clearSelection();
              }}
              totalPages={totalPages}
              page={page}
              setPage={(n) => {
                setPage(n);
                clearSelection();
              }}
            />
          ),
        }}
        footerVersion={pkg.version}
      />

      <ModalLayout
        mkdir={modals.mkdir}
        rename={modals.rename}
        settings={modals.settings}
        move={{ ...modals.move, options: moveOptions }}
      />
    </>
  );
}

export const App = memo(AppBase);
