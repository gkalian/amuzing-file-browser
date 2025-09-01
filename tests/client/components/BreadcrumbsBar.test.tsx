import React from 'react'
import { render, screen } from '../../utils/test-utils'

import { BreadcrumbsBar } from '@/client/components/navigation/BreadcrumbsBar'

describe('BreadcrumbsBar (render-only)', () => {
  const crumbs = [
    { label: 'root', path: '/' },
    { label: 'docs', path: '/docs' },
    { label: 'files', path: '/docs/files' },
  ]

  it('should render the last crumb and prefix', () => {
    render(
      <BreadcrumbsBar
        crumbs={crumbs}
        cwd={crumbs[crumbs.length - 1].path}
        onCrumbClick={() => {}}
        onUp={() => {}}
      />
    )

    expect(screen.getByText('root')).toBeInTheDocument()
    expect(screen.getByText('docs')).toBeInTheDocument()
    expect(screen.getByText('files')).toBeInTheDocument()
  })
})
