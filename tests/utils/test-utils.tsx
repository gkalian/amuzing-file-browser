import React from 'react'
import { MantineProvider } from '@mantine/core'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
export * from '@testing-library/react'

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider defaultColorScheme="light">
      {children}
    </MantineProvider>
  )
}

export function render(ui: React.ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { wrapper: Providers as React.ComponentType, ...options })
}
