// Breadcrumbs navigation bar for the current working directory
import React, { memo } from 'react';
import { Group, Breadcrumbs as MantineBreadcrumbs, Anchor } from '@mantine/core';

export type Crumb = { label: string; path: string };

type Props = {
  crumbs: Crumb[];
  cwd: string;
  onCrumbClick: (path: string) => void;
  onUp: () => void; // kept for compatibility, not rendered
};

function BreadcrumbsBarBase({ crumbs, onCrumbClick }: Props) {
  return (
    <Group mb="sm" gap="xs">
      <MantineBreadcrumbs>
        {crumbs.map((c, i) => (
          <Anchor key={i} onClick={() => onCrumbClick(c.path)}>
            {c.label}
          </Anchor>
        ))}
      </MantineBreadcrumbs>
    </Group>
  );
}
export const BreadcrumbsBar = memo(BreadcrumbsBarBase);
