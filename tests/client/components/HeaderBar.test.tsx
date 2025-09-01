import React from 'react'
import { render, screen } from '../../utils/test-utils'
import { HeaderBar } from '@/client/components/layout/HeaderBar'

describe('HeaderBar (render-only)', () => {
  const props = {
    search: '',
    setSearch: () => {},
    onUpload: () => {},
    onNewFolder: () => {},
    onOpenSettings: () => {},
    onLogoClick: () => {},
    theme: 'light' as const,
  }

  it('should render logo, search field and action buttons', () => {
    render(<HeaderBar {...props} />)

    expect(screen.getByTestId('logo')).toBeInTheDocument()
    expect(screen.getByTestId('search-input')).toBeInTheDocument()
    expect(screen.getByTestId('btn-upload')).toBeInTheDocument()
    expect(screen.getByTestId('btn-new-folder')).toBeInTheDocument()
    expect(screen.getByTestId('btn-settings')).toBeInTheDocument()
  })
})
