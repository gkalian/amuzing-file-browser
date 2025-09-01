import React from 'react'
import { render, screen } from '../../utils/test-utils'
import { BottomBar } from '@/client/components/layout/BottomBar'

describe('BottomBar (render-only)', () => {
  it('should render stats and pager controls', () => {
    render(
      <BottomBar
        totals={{ files: 10, dirs: 3, size: 123456 }}
        pageSize={'25'}
        setPageSize={() => {}}
        totalPages={5}
        page={1}
        setPage={() => {}}
      />
    )

    expect(screen.getByTestId('stats')).toBeInTheDocument()
    expect(screen.getByTestId('pager-controls')).toBeInTheDocument()
  })
})
