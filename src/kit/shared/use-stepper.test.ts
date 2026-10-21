import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStepper } from './use-stepper';

describe('useStepper', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('moves within the step range and pauses autoplay on interaction', () => {
    const { result } = renderHook(() => useStepper({ count: 3, autoplay: false, intervalMs: 1000 }));

    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
    act(() => result.current.prev());
    expect(result.current.index).toBe(0);
    act(() => result.current.goTo(8));
    expect(result.current.index).toBe(2);
    expect(result.current.playing).toBe(false);
  });

  it('autoplays and stops at the final step', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useStepper({ count: 3, autoplay: true, intervalMs: 1000 }));

    expect(result.current.playing).toBe(true);
    act(() => vi.advanceTimersByTime(2000));

    expect(result.current.index).toBe(2);
    expect(result.current.playing).toBe(false);
  });

  it('does not autoplay when reduced motion is preferred', () => {
    vi.useFakeTimers();
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const { result } = renderHook(() => useStepper({ count: 3, autoplay: true, intervalMs: 1000 }));

    act(() => vi.advanceTimersByTime(2000));

    expect(result.current.index).toBe(0);
    expect(result.current.playing).toBe(false);
  });
});