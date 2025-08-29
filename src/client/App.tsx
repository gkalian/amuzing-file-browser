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
  const [selected, setSelected] = useState<FsItem | null>(null);
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
  } = useSettings({ defaultAllowedTypes: DEFAULT_ALLOWED_TYPES, t });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const v = localStorage.getItem('mantine-color-scheme') as 'light' | 'dark' | null;
      return v || 'light';
    } catch {
      return 'light';
    }
  });

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
    // clear preview selection when changing directory
    setSelected(null);
  }, [cwd]);

  // settings are loaded and autosaved via useSettings()

  // Apply theme immediately when changed
  useEffect(() => {
    document.documentElement.setAttribute('data-mantine-color-scheme', theme);
    try {
      localStorage.setItem('mantine-color-scheme', theme);
    } catch (e) {
      console.debug('persist theme failed', e);
    }
  }, [theme]);

  // Persist preview preference
  useEffect(() => {
    try {
      localStorage.setItem('showPreview', String(showPreview));
    } catch (e) {
      console.debug('persist preview flag failed', e);
    }
  }, [showPreview]);

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
        if (selected?.path === item.path) setSelected(null);
      }).catch(() => {});
    },
    [remove, selected?.path]
  );

  const handleRename = useCallback(async () => {
    if (!selected) return;
    if (!renameName.trim()) return;
    await rename(selected, renameName.trim()).then(() => {
      setRenameOpen(false);
      setSelected(null);
    }).catch(() => {});
  }, [rename, selected, renameName]);

  // no editor modal anymore; only preview panel

  const onOpen = useCallback((item: FsItem) => {
    if (item.isDir) {
      setCwd(item.path);
      setSelected(null);
    } else if ((item.mime || '').startsWith('image/')) {
      // toggle select/deselect image for preview
      setSelected((prev) => (prev?.path === item.path ? null : item));
    } else {
      // do not open editor, no selection for non-images
      setSelected(null);
    }
  }, []);

  const requestRename = useCallback((it: FsItem) => {
    setSelected(it);
    setRenameName(it.name);
    setRenameOpen(true);
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const list = items || [];
    if (!q) return list;
    return list.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, debouncedSearch]);

  const totals = useTotals(filtered as any);
  const { paged, totalPages } = usePageSlice(filtered as any[], page, Number(pageSize));
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
            selected={selected}
            onOpen={onOpen}
            onRequestRename={requestRename}
            onDelete={handleDelete}
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

