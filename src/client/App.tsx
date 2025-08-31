// App root component: orchestrates layout, state, API calls, and wiring between UI parts
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { type FsItem } from './services/apiClient';
import pkg from '../../package.json';
import { parentPath } from './core/utils';
import { HeaderBar } from './components/HeaderBar';
import { BreadcrumbsBar } from './components/BreadcrumbsBar';
import { FileBrowserPane } from './components/FileBrowserPane';
import { BottomBar } from './components/BottomBar';
import { AppFooter } from './components/AppFooter';
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
      // Directories: open on plain click; ignore for selection
      if (item.isDir) {
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
          setCwd(item.path);
          setSelectedPaths(new Set());
          setLastSelectedIndex(null);
        }
        return;
      }

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

  const requestRename = useCallback((it: FsItem) => {
    setRenameTarget(it);
    setRenameName(it.name);
    setRenameOpen(true);
  }, []);

  
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
          <BreadcrumbsBar
            crumbs={crumbs}
            cwd={cwd}
            onCrumbClick={(p) => setCwd(p)}
            onUp={() => setCwd(parentPath(cwd))}
          />

          <FileBrowserPane
            items={paged as any}
            loading={loading}
            selectedPaths={selectedPaths}
            onItemClick={onItemClick}
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
            splitRef={splitRef as any}
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
    </AppShell>
  );
}

export const App = memo(AppBase);
