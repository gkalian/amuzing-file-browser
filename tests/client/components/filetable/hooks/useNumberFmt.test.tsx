import React from 'react';
import { render, screen } from '../../../../utils/test-utils';
import { useNumberFmt } from '@/client/components/filetable/hooks/useNumberFmt';

function TestComp() {
  const fmt = useNumberFmt();
  return <div>{fmt.format(12345)}</div>;
}

describe('useNumberFmt', () => {
  it('formats numbers', () => {
    render(<TestComp />);
    expect(screen.getByText(/12,345|12\s?345/)).toBeInTheDocument();
  });
});
