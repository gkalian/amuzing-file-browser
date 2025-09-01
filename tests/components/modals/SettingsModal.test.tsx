import React from 'react'
import { render, screen } from '../../utils/test-utils'
import { SettingsModal } from '@/client/components/modals/SettingsModal'

describe('SettingsModal (render-only)', () => {
  it('should render settings controls when opened', () => {
    render(
      <SettingsModal
        opened
        onClose={() => {}}
        cfgRoot="/root"
        setCfgRoot={() => {}}
        cfgMaxUpload={10}
        setCfgMaxUpload={() => {}}
        cfgAllowedTypes="jpg,png"
        setCfgAllowedTypes={() => {}}
        theme="light"
        setTheme={() => {}}
        showPreview={true}
        setShowPreview={() => {}}
      />
    )

    expect(screen.getByTestId('modal-settings')).toBeInTheDocument()
    expect(screen.getByTestId('settings-root')).toBeInTheDocument()
    expect(screen.getByTestId('settings-maxupload')).toBeInTheDocument()
    expect(screen.getByTestId('settings-allowed-types')).toBeInTheDocument()
    expect(screen.getByTestId('settings-theme')).toBeInTheDocument()
    expect(screen.getByTestId('settings-preview')).toBeInTheDocument()
    expect(screen.getByTestId('settings-language')).toBeInTheDocument()
  })
})
