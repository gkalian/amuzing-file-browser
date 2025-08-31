// App root component: orchestrates layout, state, API calls, and wiring between UI parts
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell, Box, Group, Button } from '@mantine/core';
import { api, type FsItem } from './services/apiClient';
import pkg from '../../package.json';
import { parentPath, joinPath } from './core/utils';
import { HeaderBar } from './components/HeaderBar';
import { BreadcrumbsBar } from './components/BreadcrumbsBar';
import { FileBrowserPane } from './components/FileBrowserPane';
import { BottomBar } from './components/BottomBar';
import { AppFooter } from './components/AppFooter';
import { MoveModal } from './components/MoveModal';
import { notifyError, notifySuccess } from './core/notify';
import { UploadQueue } from './components/UploadQueue';
import { MkdirModal } from './components/MkdirModal';
import { RenameModal } from './components/RenameModal';
import { SettingsModal } from './components/SettingsModal';
import { useTranslation } from 'react-i18next';
// internal hooks
import { useFileList } from './hooks/useFileList';
import { useSearch } from './hooks/useSearch';
import { useSplitPane } from './hooks/useSplitPane';
import { useIsNarrow } from './hooks/useIsNarrow';
import { useBreadcrumbs } from './hooks/useBreadcrumbs';
import { useTotals } from './hooks/useTotals';
import { useUploads } from './hooks/useUploads';
import { useSettings } from './hooks/useSettings';
import { usePageSlice } from './hooks/usePageSlice';
import { useFileSystemOps } from './hooks/useFileSystemOps';

function AppBase() {
  // no direct i18n usage in this component
  const { t } = useTranslation();
  const DEFAULT_ALLOWED_TYPES = 'jpg, jpeg, gif, png, webp, 7z, zip';
  const [cwd, setCwd] = useState<string>('/');
  // multi-select: store selected file paths (folders are not selectable)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  // anchor index for Shift-range selection within current page
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
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

  // upload progress state handled by hook
  const [showPreview, setShowPreview] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('showPreview');
      return v ? v === 'true' : true;
    } catch {
      return true;
    }
  });

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

  useEffect(() => {
    // clear selection when changing directory
    setSelectedPaths(new Set());
    setLastSelectedIndex(null);
  }, [cwd]);

  // settings are loaded and autosaved via useSettings()

  // Apply theme immediately when changed
  useEffect(() => {
    document.documentElement.setAttribute('data-mantine-color-scheme', theme);
  }, [theme]);

  // Persist preview preference
  useEffect(() => {
    try {
      localStorage.setItem('showPreview', String(showPreview));
    } catch (e) {
      console.debug('persist preview flag failed', e);
    }
  }, [showPreview]);

  // Allow deselect with Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPaths(new Set());
        setLastSelectedIndex(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // autosave is handled in useSettings

  const crumbs = useBreadcrumbs(cwd, t('breadcrumbs.root', { defaultValue: 'root' }));
  // uploads hook (keeps this file slim)
  const { uploading, uploadedBytes, totalBytes, uploadItems, handleUpload } = useUploads({
    cwd,
    allowedTypes: cfgAllowedTypes,
    t,
    loadList,
  });

  // filesystem operations
  const { mkdir, remove, rename } = useFileSystemOps({ cwd, t, loadList });

  // filter and pagination derived data (used by click handlers)
  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = items || [];
    if (!q) return list;
    return list.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, debouncedSearch]);
  const totals = useTotals(filtered as any);
  const { paged, totalPages } = usePageSlice(filtered as any[], page, Number(pageSize));


  const handleMkdir = useCallback(async () => {
    if (!mkdirName.trim()) return;
    await mkdir(mkdirName.trim()).then(() => {
      setMkdirName('');
      setMkdirOpen(false);
    }).catch(() => {});
  }, [mkdirName, mkdir]);

  const handleDelete = useCallback(
    async (item: FsItem) => {
      await remove(item).then(() => {
        setSelectedPaths((prev) => {
          if (!prev.size) return prev;
          const next = new Set(prev);
          next.delete(item.path);
          return next;
        });
      }).catch(() => {});
    },
    [remove]
  );

  const [renameTarget, setRenameTarget] = useState<FsItem | null>(null);
  const handleRename = useCallback(async () => {
    if (!renameTarget) return;
    if (!renameName.trim()) return;
    await rename(renameTarget, renameName.trim()).then(() => {
      setRenameOpen(false);
      setRenameTarget(null);
      setSelectedPaths((prev) => {
        const next = new Set(prev);
        next.delete(renameTarget.path);
        return next;
      });
    }).catch(() => {});
  }, [rename, renameTarget, renameName]);

  // no editor modal anymore; only preview panel

  const onItemClick = useCallback(
    (item: FsItem, index: number, e: React.MouseEvent) => {
      // Directories are not selected and not opened on single click
      if (item.isDir) return;

      // Files selection logic
      const path = item.path;
      const isToggle = e.ctrlKey || e.metaKey;
      const isRange = e.shiftKey && lastSelectedIndex !== null;

      if (isRange) {
        // Select a contiguous range within current page, only files
        const start = Math.min(lastSelectedIndex!, index);
        const end = Math.max(lastSelectedIndex!, index);
        const rangePaths = new Set<string>();
        for (let i = start; i <= end; i++) {
          const it = (paged as unknown as FsItem[])[i];
          if (it && !it.isDir) rangePaths.add(it.path);
        }
        setSelectedPaths(rangePaths);
      } else if (isToggle) {
        setSelectedPaths((prev) => {
          const next = new Set(prev);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return next;
        });
        setLastSelectedIndex(index);
      } else {
        // single selection
        setSelectedPaths(new Set([path]));
        setLastSelectedIndex(index);
      }
    },
    [lastSelectedIndex, paged]
  );

  const onItemDoubleClick = useCallback(
    (item: FsItem, _index: number, _e: React.MouseEvent) => {
      if (item.isDir) {
        setCwd(item.path);
        setSelectedPaths(new Set());
        setLastSelectedIndex(null);
      }
    },
    []
  );

  const requestRename = useCallback((it: FsItem) => {
    setRenameTarget(it);
    setRenameName(it.name);
    setRenameOpen(true);
  }, []);

  // bulk: clear selection
  const clearSelection = useCallback(() => {
    setSelectedPaths(new Set());
    setLastSelectedIndex(null);
  }, []);

  // bulk: delete selected files
  const handleBulkDelete = useCallback(async () => {
    if (!selectedPaths.size) return;
    setBulkWorking(true);
    try {
      const paths = Array.from(selectedPaths);
      let ok = 0, fail = 0;
      for (const p of paths) {
        try {
          await api.delete(p);
          ok++;
        } catch (e: any) {
          fail++;
          notifyError(`${p}: ${String(e?.message || e)}`, 'Delete failed');
        }
      }
      await loadList(cwd);
      clearSelection();
      if (ok) notifySuccess(`Deleted ${ok} file(s)`);
      if (fail) notifyError(`Failed to delete ${fail} file(s)`);
    } finally {
      setBulkWorking(false);
    }
  }, [selectedPaths, cwd, loadList, clearSelection]);

  // bulk: move selected files to destination
  const handleBulkMove = useCallback(async () => {
    const dest = (moveDest || '').trim();
    if (!dest || !selectedPaths.size) return;
    setBulkWorking(true);
    try {
      // find names for paths
      const all = items || [];
      const byPath = new Map(all.map((it) => [it.path, it] as const));
      const paths = Array.from(selectedPaths);
      let ok = 0, fail = 0;
      for (const p of paths) {
        const it = byPath.get(p);
        if (!it) {
          fail++;
          notifyError(`${p}: not found in list`, 'Move failed');
          continue;
        }
        const to = joinPath(dest, it.name);
        try {
          await api.rename(p, to);
          ok++;
        } catch (e: any) {
          fail++;
          notifyError(`${it.name}: ${String(e?.message || e)}`, 'Move failed');
        }
      }
      await loadList(cwd);
      clearSelection();
      setMoveOpen(false);
      setMoveDest('');
      if (ok) notifySuccess(`Moved ${ok} file(s)`);
      if (fail) notifyError(`Failed to move ${fail} file(s)`);
    } finally {
      setBulkWorking(false);
    }
  }, [moveDest, selectedPaths, items, cwd, loadList, clearSelection]);

  // destination options for move: current folder and its subfolders
  const moveOptions = useMemo(() => {
    const set = new Set<string>();
    set.add(cwd);
    (items || []).forEach((it) => { if (it.isDir) set.add(it.path); });
    return Array.from(set);
  }, [items, cwd]);

  const onRenameSelected = useCallback(() => {
    if (selectedPaths.size !== 1) return;
    const p = Array.from(selectedPaths)[0];
    const it = (items || []).find((i) => i.path === p);
    if (!it) return;
    setRenameTarget(it);
    setRenameName(it.name);
    setRenameOpen(true);
  }, [selectedPaths, items]);

  
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
            />
          }
        />
      </AppShell.Header>

      <AppShell.Main style={{ overflowX: 'auto' }}>
        <Box style={{ minWidth: 700 }}>
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <BreadcrumbsBar
              crumbs={crumbs}
              cwd={cwd}
              onCrumbClick={(p) => setCwd(p)}
              onUp={() => setCwd(parentPath(cwd))}
            />
            {selectedPaths.size > 0 && (
              <Group gap="xs" wrap="nowrap">
                <Button size="xs" variant="light" onClick={onRenameSelected} disabled={selectedPaths.size !== 1 || bulkWorking}>
                  Rename
                </Button>
                <Button size="xs" variant="light" color="red" onClick={handleBulkDelete} disabled={bulkWorking}>
                  Delete
                </Button>
                <Button size="xs" variant="light" onClick={() => { setMoveDest(cwd); setMoveOpen(true); }} disabled={bulkWorking}>
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
            onItemDoubleClick={onItemDoubleClick}
            onRequestRename={requestRename}
            onDelete={handleDelete}
            onDeselect={() => {
              setSelectedPaths(new Set());
              setLastSelectedIndex(null);
            }}
            showPreview={showPreview}
            isNarrow={isNarrow}
            split={split}
            setDragging={setDragging}
            splitRef={splitRef}
          />

          <BottomBar
            totals={totals}
            pageSize={pageSize}
            setPageSize={(v) => setPageSize(v)}
            totalPages={totalPages}
            page={page}
            setPage={setPage}
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
