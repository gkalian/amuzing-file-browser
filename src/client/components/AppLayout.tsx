// AppLayout: отвечает за каркас приложения (AppShell, Header, Main, Footer)
import React from 'react';
import { AppShell, Box, Group } from '@mantine/core';
import { HeaderBar } from './layout/HeaderBar';
import { BreadcrumbsBar } from './navigation/BreadcrumbsBar';
import { AppFooter } from './layout/AppFooter';

export type Crumb = { label: string; path: string };

export function AppLayout(props: {
  theme: 'light' | 'dark';
  header: {
    search: string;
    setSearch: (v: string) => void;
    onUpload: (files: File[]) => void;
    onNewFolder: () => void;
    onOpenSettings: () => void;
    onLogoClick: () => void;
    progressSlot: React.ReactNode;
  };
  breadcrumbs: {
    crumbs: Crumb[];
    cwd: string;
    onCrumbClick: (p: string) => void;
    onUp: () => void;
    rightActions?: React.ReactNode;
  };
  main: {
    content: React.ReactNode; // основной контент (обычно FileBrowserPane)
    bottomBar: React.ReactNode; // низ страницы (пагинация/итоги)
  };
  footerVersion: string;
}) {
  const { theme, header, breadcrumbs, main, footerVersion } = props;
  return (
    <AppShell header={{ height: 72 }} footer={{ height: 56 }} padding="md">
      <AppShell.Header>
        <HeaderBar
          search={header.search}
          setSearch={header.setSearch}
          onUpload={header.onUpload}
          onNewFolder={header.onNewFolder}
          onOpenSettings={header.onOpenSettings}
          onLogoClick={header.onLogoClick}
          theme={theme}
          progressSlot={header.progressSlot}
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
            <Box style={{ marginLeft: 10 }}>
              <BreadcrumbsBar
                crumbs={breadcrumbs.crumbs}
                cwd={breadcrumbs.cwd}
                onCrumbClick={breadcrumbs.onCrumbClick}
                onUp={breadcrumbs.onUp}
              />
            </Box>
            {breadcrumbs.rightActions && (
              <Group gap="xs" wrap="nowrap">
                {breadcrumbs.rightActions}
              </Group>
            )}
          </Box>

          {main.content}
          {main.bottomBar}
        </Box>
      </AppShell.Main>

      <AppShell.Footer>
        <AppFooter version={footerVersion} />
      </AppShell.Footer>
    </AppShell>
  );
}
