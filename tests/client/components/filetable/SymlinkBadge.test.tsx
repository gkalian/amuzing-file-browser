import React from 'react';
import { render, screen } from '../../../utils/test-utils';
import { SymlinkBadge } from '@/client/components/filetable/SymlinkBadge';

describe('SymlinkBadge', () => {
  it('renders "symlink" label', () => {
    render(<SymlinkBadge />);
    expect(screen.getByText(/symlink/i)).toBeInTheDocument();
  });

  it('renders for broken and unsafe states', () => {
    render(
      <div>
        <SymlinkBadge isBroken />
        <SymlinkBadge isUnsafe />
      </div>
    );
    const badges = screen.getAllByText(/symlink/i);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });
});
