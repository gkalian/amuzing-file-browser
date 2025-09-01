import React from 'react';
import { render, screen } from '../../utils/test-utils';
import { AppFooter } from '@/client/components/layout/AppFooter';

describe('AppFooter (render-only)', () => {
  it('should render and show version', () => {
    render(<AppFooter version="1.2.3" />);

    expect(screen.getByText(/Amuzing File Browser/i)).toBeInTheDocument();
    expect(screen.getByText(/1.2.3/)).toBeInTheDocument();
  });
});
