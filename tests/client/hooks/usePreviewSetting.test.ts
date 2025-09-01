import { renderHook, act } from '@testing-library/react';
import { usePreviewSetting } from '@/client/hooks/ui/usePreviewSetting';

describe('usePreviewSetting (very simple)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads initial value from localStorage or falls back to default', () => {
    localStorage.setItem('showPreview', 'false');
    const { result } = renderHook(() => usePreviewSetting(true));
    expect(result.current.showPreview).toBe(false);
  });

  it('persists updates to localStorage', () => {
    const setItemSpy = vi.spyOn(window.localStorage.__proto__, 'setItem');
    const { result } = renderHook(() => usePreviewSetting(false));

    act(() => {
      result.current.setShowPreview(true);
    });

    expect(result.current.showPreview).toBe(true);
    expect(setItemSpy).toHaveBeenCalledWith('showPreview', 'true');
    setItemSpy.mockRestore();
  });
});
