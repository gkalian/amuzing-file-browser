import { renderHook } from '@testing-library/react'
import { useThemeSync } from '@/client/hooks/ui/useThemeSync'

describe('useThemeSync (very simple)', () => {
  it('sets data-mantine-color-scheme on document.documentElement', () => {
    const { rerender } = renderHook(({ theme }: { theme: 'light' | 'dark' }) => useThemeSync(theme), {
      initialProps: { theme: 'light' as 'light' | 'dark' },
    })

    expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('light')

    rerender({ theme: 'dark' as 'light' | 'dark' })
    expect(document.documentElement.getAttribute('data-mantine-color-scheme')).toBe('dark')
  })
})
