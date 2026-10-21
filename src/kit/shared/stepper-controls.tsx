'use client';

import type { KeyboardEvent } from 'react';

type StepperControlsProps = {
  index: number;
  count: number;
  playing: boolean;
  next: () => void;
  prev: () => void;
  play: () => void;
  pause: () => void;
};

export function StepperControls({ index, count, playing, next, prev, play, pause }: StepperControlsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  }

  return (
    <div
      aria-label="Stepper controls"
      className="my-4 flex items-center justify-between gap-3"
      onKeyDown={handleKeyDown}
      role="group"
      tabIndex={0}
    >
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous step"
          className="rounded border border-border px-3 py-2 text-sm text-fg disabled:opacity-50"
          disabled={index === 0}
          onClick={prev}
          type="button"
        >
          Previous
        </button>
        <button
          aria-label={playing ? 'Pause playback' : 'Play playback'}
          className="rounded border border-border px-3 py-2 text-sm text-fg disabled:opacity-50"
          disabled={!playing && index >= count - 1}
          onClick={playing ? pause : play}
          type="button"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          aria-label="Next step"
          className="rounded border border-border px-3 py-2 text-sm text-fg disabled:opacity-50"
          disabled={index >= count - 1}
          onClick={next}
          type="button"
        >
          Next
        </button>
      </div>
      <span aria-live="polite" className="text-sm text-muted">
        Step {index + 1} of {count}
      </span>
    </div>
  );
}