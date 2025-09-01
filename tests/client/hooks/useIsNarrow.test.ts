import { renderHook, act } from '@testing-library/react'
import { useIsNarrow } from '@/client/hooks/ui/useIsNarrow'

describe('useIsNarrow (very simple)', () => {
  const origInnerWidth = window.innerWidth

  afterEach(() => {
    // restore original width between tests
    ;(window as any).innerWidth = origInnerWidth
  })

  it('returns false when width >= threshold and true when width < threshold', () => {
    ;(window as any).innerWidth = 800
    const { result } = renderHook(() => useIsNarrow(700))
    expect(result.current).toBe(false)

    act(() => {
      ;(window as any).innerWidth = 600
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toBe(true)
  })
})
