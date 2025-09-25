import React from 'react';
import { Table } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function FileTableHeader() {
  const { t } = useTranslation();
  return (
    <Table.Tr>
      <Table.Th>{t('table.headers.name', { defaultValue: 'Name' })}</Table.Th>
      <Table.Th>{t('table.headers.size', { defaultValue: 'Size' })}</Table.Th>
      <Table.Th>{t('table.headers.modified', { defaultValue: 'Modified' })}</Table.Th>
      <Table.Th style={{ width: 220 }}></Table.Th>
    </Table.Tr>
  );
}
