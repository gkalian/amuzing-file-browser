import React from 'react'
import { render, screen } from '../../../utils/test-utils'
import { RenameModal } from '@/client/components/modals/RenameModal'

describe('RenameModal (render-only)', () => {
  it('should render input and rename button when opened', () => {
    render(
      <RenameModal
        opened
        name="old.txt"
        setName={() => {}}
        onRename={() => {}}
        onClose={() => {}}
      />
    )

    expect(screen.getByPlaceholderText(/New name/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Rename/i)[0]).toBeInTheDocument()
  })
})
