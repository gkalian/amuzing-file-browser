import { renderHook, act } from '@testing-library/react';
import { useSplitPane } from '@/client/hooks/ui/useSplitPane';

describe('useSplitPane (very simple)', () => {
  const origRAF = window.requestAnimationFrame;
  const origCancelRAF = window.cancelAnimationFrame;

  beforeAll(() => {
    // Minimal RAF polyfill to execute callback immediately
    // @ts-ignore
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1 as any;
    };
    // @ts-ignore
    window.cancelAnimationFrame = () => {};
  });

  afterAll(() => {
    window.requestAnimationFrame = origRAF;
    window.cancelAnimationFrame = origCancelRAF;
  });

  it('updates split percentage while dragging with clamping', () => {
    const { result } = renderHook(() => useSplitPane(70, 60, 80));

    // provide a fake element for measurements
    const el = {
      getBoundingClientRect: () =>
        ({ left: 0, width: 100, top: 0, right: 100, bottom: 0, height: 0 }) as DOMRect,
    } as unknown as HTMLDivElement;
    result.current.splitRef.current = el;

    // 1) start dragging and move near the right edge -> should clamp to max=80
    act(() => {
      result.current.setDragging(true);
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 90 }));
    });
    expect(result.current.split).toBe(80);

    // stop dragging
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    // 2) start a new drag and move to 10% -> should clamp to min=60
    act(() => {
      result.current.setDragging(true);
    });
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10 }));
    });
    expect(result.current.split).toBe(60);
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
  });
});
