import React from 'react'
import { render, screen, within } from '../../utils/test-utils'
import { MoveModal } from '@/client/components/modals/MoveModal'

describe('MoveModal (render-only)', () => {
  it('should render destination input and move button when opened', () => {
    render(
      <MoveModal
        opened
        dest=""
        setDest={() => {}}
        options={['/a', '/b']}
        onMove={() => {}}
        onClose={() => {}}
      />
    )

    const dialog = screen.getByRole('dialog')
    const modal = within(dialog)
    expect(modal.getByPlaceholderText(/Choose or type folder path/i)).toBeInTheDocument()
    expect(modal.getByRole('button', { name: /Move/i })).toBeInTheDocument()
  })
})
