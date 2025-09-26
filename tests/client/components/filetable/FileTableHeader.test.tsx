import React from 'react';
import { render, screen } from '../../../utils/test-utils';
import { Table } from '@mantine/core';
import { FileTableHeader } from '@/client/components/filetable/FileTableHeader';

describe('FileTableHeader', () => {
  it('renders default column titles', () => {
    render(
      <Table>
        <Table.Thead>
          <FileTableHeader />
        </Table.Thead>
      </Table>
    );
    expect(screen.getByText(/Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Size/i)).toBeInTheDocument();
    expect(screen.getByText(/Modified/i)).toBeInTheDocument();
  });
});
