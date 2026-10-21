import { useCallback, useEffect, useRef, useState } from 'react';

type UseStepperOptions = {
  count: number;
  autoplay: boolean;
  intervalMs: number;
};

export function useStepper({ count, autoplay, intervalMs }: UseStepperOptions) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const indexRef = useRef(index);

  useEffect(() => {
    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : undefined;
    const syncPreference = () => {
      if (mediaQuery?.matches || !autoplay || count < 2) {
        setPlaying(false);
      } else {
        setPlaying(true);
      }
    };

    syncPreference();
    mediaQuery?.addEventListener('change', syncPreference);
    return () => mediaQuery?.removeEventListener('change', syncPreference);
  }, [autoplay, count]);

  useEffect(() => {
    if (!playing || count < 2) return;

    const timer = window.setInterval(() => {
      if (indexRef.current >= count - 1) {
        setPlaying(false);
        return;
      }

      const nextIndex = indexRef.current + 1;
      indexRef.current = nextIndex;
      setIndex(nextIndex);
      if (nextIndex === count - 1) setPlaying(false);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [count, intervalMs, playing]);

  const pause = useCallback(() => setPlaying(false), []);
  const play = useCallback(() => {
    if (indexRef.current < count - 1 && count > 1) setPlaying(true);
  }, [count]);
  const next = useCallback(() => {
    pause();
    const nextIndex = Math.min(indexRef.current + 1, count - 1);
    indexRef.current = nextIndex;
    setIndex(nextIndex);
  }, [count, pause]);
  const prev = useCallback(() => {
    pause();
    const previousIndex = Math.max(indexRef.current - 1, 0);
    indexRef.current = previousIndex;
    setIndex(previousIndex);
  }, [pause]);
  const goTo = useCallback(
    (targetIndex: number) => {
      pause();
      const nextIndex = Math.max(0, Math.min(targetIndex, count - 1));
      indexRef.current = nextIndex;
      setIndex(nextIndex);
    },
    [count, pause],
  );

  return { index, next, prev, goTo, playing, play, pause };
}