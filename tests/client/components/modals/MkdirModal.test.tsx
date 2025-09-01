import React from 'react';
import { render, screen, within } from '../../../utils/test-utils';
import { MkdirModal } from '@/client/components/modals/MkdirModal';

describe('MkdirModal (render-only)', () => {
  it('should render input and create button when opened', () => {
    render(<MkdirModal opened name="" setName={() => {}} onCreate={() => {}} onClose={() => {}} />);

    // Scope queries to the dialog to avoid matching other buttons
    const dialog = screen.getByRole('dialog');
    const modal = within(dialog);
    expect(modal.getByPlaceholderText(/Folder name/i)).toBeInTheDocument();
    expect(modal.getByRole('button', { name: /Create/i })).toBeInTheDocument();
  });
});
