// App root component: orchestrates layout, state, API calls, and wiring between UI parts
import { memo, useCallback, useMemo, useState } from 'react';
import { AppShell, Box, Group, Button } from '@mantine/core';
import type { FsItem } from './core/types';
import pkg from '../../package.json';
import { parentPath } from './core/utils';
import { HeaderBar } from './components/layout/HeaderBar';
import { BreadcrumbsBar } from './components/navigation/BreadcrumbsBar';
import { FileBrowserPane } from './components/browser/FileBrowserPane';
import { BottomBar } from './components/layout/BottomBar';
import { AppFooter } from './components/layout/AppFooter';
import { MoveModal } from './components/modals/MoveModal';
import { UploadQueue } from './components/upload/UploadQueue';
import { MkdirModal } from './components/modals/MkdirModal';
import { RenameModal } from './components/modals/RenameModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { useTranslation } from 'react-i18next';
// internal hooks
import { useFileList } from './hooks/data/useFileList';
import { useSearch } from './hooks/navigation/useSearch';
import { useSplitPane } from './hooks/ui/useSplitPane';
import { useIsNarrow } from './hooks/ui/useIsNarrow';
import { useBreadcrumbs } from './hooks/navigation/useBreadcrumbs';
import { useTotals } from './hooks/pagination/useTotals';
import { useUploads } from './hooks/uploads/useUploads';
import { useSettings } from './hooks/ui/useSettings';
import { usePageSlice } from './hooks/pagination/usePageSlice';
import { useFileSystemOps } from './hooks/data/useFileSystemOps';
import { usePreviewSetting } from './hooks/ui/usePreviewSetting';
import { useSelection } from './hooks/selection/useSelection';
import { useBulkOps } from './hooks/selection/useBulkOps';
import { useMoveOptions } from './hooks/selection/useMoveOptions';
import { useThemeSync } from './hooks/ui/useThemeSync';

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

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<'25' | '50' | '100'>('25');

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

  // dialogs
  const [mkdirOpen, setMkdirOpen] = useState(false);
  const [mkdirName, setMkdirName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  // removed inline editor
  // bulk operations
  const [bulkWorking, setBulkWorking] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDest, setMoveDest] = useState('');

  // selection clear on cwd change handled in useSelection hook

  // settings are loaded and autosaved via useSettings()

  // Sync theme attribute
  useThemeSync(theme);

  // preview persistence handled in usePreviewSetting

  // Escape handling is in useSelection

  // autosave is handled in useSettings

  const crumbs = useBreadcrumbs(cwd, t('breadcrumbs.root', { defaultValue: 'root' }));
  // uploads hook (keeps this file slim)
  const { uploading, uploadedBytes, totalBytes, uploadItems, uploadSpeedBps, cancelUploads, handleUpload, handleUploadTo } =
    useUploads({
      cwd,
      allowedTypes: cfgAllowedTypes,
      t,
      loadList,
    });

  // filesystem operations
  const { mkdir, rename } = useFileSystemOps({ cwd, t, loadList });

  // filter and pagination derived data (used by click handlers)
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = items || [];
    if (!q) return list;
    return list.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, debouncedSearch]);
  const totals = useTotals(filtered as any);
  // sorting state and application
  const [sortField, setSortField] = useState<'name' | 'size' | 'mtime' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const sorted = useMemo(() => {
    const arr = [...(filtered as FsItem[])];
    if (!sortField) return arr;
    const dirMul = sortDir === 'asc' ? 1 : -1;
    return arr.sort((a, b) => {
      if (sortField === 'name') {
        const an = (a.name || '').toLowerCase();
        const bn = (b.name || '').toLowerCase();
        return an.localeCompare(bn) * dirMul;
      }
      if (sortField === 'size') {
        return ((a.size || 0) - (b.size || 0)) * dirMul;
      }
      // mtime
      return ((a.mtimeMs || 0) - (b.mtimeMs || 0)) * dirMul;
    });
  }, [filtered, sortField, sortDir]);
  const onSort = useCallback((field: 'name' | 'size' | 'mtime') => {
    setSortField((prev) => {
      if (prev === field) {
        if (sortDir === 'asc') {
          setSortDir('desc');
          return prev; // same field, now desc
        }
        // was desc -> go to none
        setSortDir('asc'); // default dir for next time
        return null;
      }
      setSortDir('asc');
      return field;
    });
  }, [sortDir]);
  const { paged, totalPages } = usePageSlice(sorted as any[], page, Number(pageSize));

  // selection logic extracted to hook
  const { selectedPaths, setSelectedPaths, onItemClick, clearSelection } =
    useSelection({
      paged: paged as any,
      cwd,
      onOpenDir: (path) => setCwd(path),
    });

  // bulk operations extracted to hook
  const { bulkDelete, bulkMove } = useBulkOps({ cwd, items, loadList });

  const handleMkdir = useCallback(async () => {
    if (!mkdirName.trim()) return;
    await mkdir(mkdirName.trim())
      .then(() => {
        setMkdirName('');
        setMkdirOpen(false);
      })
      .catch(() => {});
  }, [mkdirName, mkdir]);

  // inline delete via table is removed; bulk delete is available via toolbar

  const [renameTarget, setRenameTarget] = useState<FsItem | null>(null);
  const handleRename = useCallback(async () => {
    if (!renameTarget) return;
    if (!renameName.trim()) return;
    await rename(renameTarget, renameName.trim())
      .then(() => {
        setRenameOpen(false);
        setRenameTarget(null);
        setSelectedPaths((prev) => {
          const next = new Set(prev);
          next.delete(renameTarget.path);
          return next;
        });
      })
      .catch(() => {});
  }, [rename, renameTarget, renameName]);

  // no editor modal anymore; only preview panel

  // selection handlers moved to useSelection

  // clearSelection provided by useSelection

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

  // bulk: move selected files to destination
  const handleBulkMove = useCallback(async () => {
    const dest = (moveDest || '').trim();
    if (!dest || !selectedPaths.size) return;
    setBulkWorking(true);
    try {
      await bulkMove(selectedPaths, dest);
      clearSelection();
      setMoveOpen(false);
      setMoveDest('');
    } finally {
      setBulkWorking(false);
    }
  }, [moveDest, selectedPaths, bulkMove, clearSelection]);

  // destination options for move
  const moveOptions = useMoveOptions(cwd, items, moveDest);

  const onRenameSelected = useCallback(() => {
    if (selectedPaths.size !== 1) return;
    const p = Array.from(selectedPaths)[0];
    const it = (items || []).find((i) => i.path === p);
    if (!it) return;
    setRenameTarget(it);
    setRenameName(it.name);
    setRenameOpen(true);
  }, [selectedPaths, items]);

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
    <AppShell header={{ height: 72 }} footer={{ height: 56 }} padding="md">
      <AppShell.Header>
        <HeaderBar
          search={search}
          setSearch={setSearchTransition}
          onUpload={(files) => handleUpload(files)}
          onNewFolder={() => setMkdirOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogoClick={() => setCwd('/')}
          theme={theme}
          progressSlot={
            <UploadQueue
              uploading={uploading}
              items={uploadItems}
              uploadedBytes={uploadedBytes}
              totalBytes={totalBytes}
              speedBps={uploadSpeedBps}
              onCancel={cancelUploads}
            />
          }
        />
      </AppShell.Header>

      <AppShell.Main style={{ overflowX: 'auto' }}>
        <Box style={{ minWidth: 700 }}>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <BreadcrumbsBar
              crumbs={crumbs}
              cwd={cwd}
              onCrumbClick={(p) => setCwd(p)}
              onUp={() => setCwd(parentPath(cwd))}
            />
            {selectedPaths.size > 0 && (
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
                  onClick={() => {
                    setMoveDest(cwd);
                    setMoveOpen(true);
                  }}
                  disabled={bulkWorking}
                >
                  Move
                </Button>
                <Button size="xs" variant="subtle" onClick={clearSelection} disabled={bulkWorking}>
                  Clear
                </Button>
              </Group>
            )}
          </Box>

          <FileBrowserPane
            items={paged as any}
            loading={loading}
            selectedPaths={selectedPaths}
            onItemClick={onItemClick}
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
        </Box>
      </AppShell.Main>

      <AppShell.Footer>
        <AppFooter version={pkg.version} />
      </AppShell.Footer>

      {/* Mkdir modal */}
      <MkdirModal
        opened={mkdirOpen}
        name={mkdirName}
        setName={setMkdirName}
        onCreate={handleMkdir}
        onClose={() => setMkdirOpen(false)}
      />

      {/* Rename modal */}
      <RenameModal
        opened={renameOpen}
        name={renameName}
        setName={setRenameName}
        onRename={handleRename}
        onClose={() => setRenameOpen(false)}
      />

      {/* Settings modal */}
      <SettingsModal
        opened={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        cfgRoot={cfgRoot}
        setCfgRoot={setCfgRoot}
        cfgMaxUpload={cfgMaxUpload}
        setCfgMaxUpload={setCfgMaxUpload}
        cfgAllowedTypes={cfgAllowedTypes}
        setCfgAllowedTypes={setCfgAllowedTypes}
        theme={theme}
        setTheme={setTheme}
        showPreview={showPreview}
        setShowPreview={setShowPreview}
      />

      {/* Move modal */}
      <MoveModal
        opened={moveOpen}
        dest={moveDest}
        setDest={setMoveDest}
        options={moveOptions}
        onMove={handleBulkMove}
        onClose={() => setMoveOpen(false)}
      />
    </AppShell>
  );
}

export const App = memo(AppBase);
