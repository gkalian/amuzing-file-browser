import React from 'react';
import { Table } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function FileTableHeader(props: {
  sortField: 'name' | 'size' | 'mtime' | null;
  sortDir: 'asc' | 'desc';
  onSort: (field: 'name' | 'size' | 'mtime') => void;
}) {
  const { t } = useTranslation();
  const { sortField, sortDir, onSort } = props;
  const arrow = (field: 'name' | 'size' | 'mtime') =>
    sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  const thStyle: React.CSSProperties = { cursor: 'pointer', userSelect: 'none' };
  return (
    <Table.Tr>
      <Table.Th style={thStyle} onClick={() => onSort('name')}>
        {t('table.headers.name', { defaultValue: 'Name' })}
        {arrow('name')}
      </Table.Th>
      <Table.Th style={thStyle} onClick={() => onSort('size')}>
        {t('table.headers.size', { defaultValue: 'Size' })}
        {arrow('size')}
      </Table.Th>
      <Table.Th style={thStyle} onClick={() => onSort('mtime')}>
        {t('table.headers.modified', { defaultValue: 'Modified' })}
        {arrow('mtime')}
      </Table.Th>
      <Table.Th style={{ width: 220 }}></Table.Th>
    </Table.Tr>
  );
}
