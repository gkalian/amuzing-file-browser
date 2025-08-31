// Breadcrumbs navigation bar for the current working directory
import React, { memo } from 'react';
import { Group, Anchor, Text } from '@mantine/core';

export type Crumb = { label: string; path: string };

type Props = {
  crumbs: Crumb[];
  cwd: string;
  onCrumbClick: (path: string) => void;
  onUp: () => void; // kept for compatibility, not rendered
};

function BreadcrumbsBarBase({ crumbs, onCrumbClick }: Props) {
  const hasCrumbs = Array.isArray(crumbs) && crumbs.length > 0;
  const last = hasCrumbs ? crumbs[crumbs.length - 1] : null;
  const prefixCrumbs = hasCrumbs ? crumbs.slice(0, -1) : [];
  return (
    <Group gap="xs" align="center" style={{ marginBottom: 0, minWidth: 0 }}>
      {/* Prefix: clickable crumbs, truncated with ellipsis */}
      <span
        style={{
          minWidth: 0,
          maxWidth: '60vw',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
        title={prefixCrumbs.map((c) => c.label).join(' / ')}
      >
        {prefixCrumbs.map((c, i) => (
          <React.Fragment key={c.path}>
            <Anchor onClick={() => onCrumbClick(c.path)}>{c.label}</Anchor>
            {i < prefixCrumbs.length - 1 && <Text span> / </Text>}
          </React.Fragment>
        ))}
        {prefixCrumbs.length > 0 && <Text span> / </Text>}
      </span>
      {/* Current leaf: always visible */}
      {last && (
        <Anchor
          onClick={() => onCrumbClick(last.path)}
          style={{
            flexShrink: 0,
            maxWidth: '30vw',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={last.label}
        >
          {last.label}
        </Anchor>
      )}
    </Group>
  );
}
export const BreadcrumbsBar = memo(BreadcrumbsBarBase);
