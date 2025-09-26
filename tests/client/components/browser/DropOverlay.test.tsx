import React from 'react';
import { render, screen } from '../../../utils/test-utils';
import { DropOverlay } from '@/client/components/browser/DropOverlay';

describe('DropOverlay', () => {
  it('renders when visible', () => {
    render(<DropOverlay visible />);
    expect(screen.getByTestId('drop-overlay')).toBeInTheDocument();
  });

  it('does not render when not visible', () => {
    render(<DropOverlay visible={false} />);
    expect(screen.queryByTestId('drop-overlay')).toBeNull();
  });
});
