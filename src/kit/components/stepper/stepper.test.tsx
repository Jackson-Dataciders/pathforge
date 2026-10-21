import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Stepper } from './Stepper';

function mockReducedMotion(matches: boolean) {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

describe('Stepper', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('advances captions with Next and arrow keys', async () => {
    const user = userEvent.setup();
    mockReducedMotion(false);
    render(
      <Stepper
        autoplay={false}
        id="release-flow"
        interval_ms={2500}
        steps={[
          { caption: 'Prepare the release.', body: 'Check the changes.' },
          { caption: 'Publish the release.', body: 'Ship the approved build.' },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(await screen.findByText('Publish the release.')).toBeInTheDocument();
    screen.getByRole('group', { name: 'Stepper controls' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(await screen.findByText('Prepare the release.')).toBeInTheDocument();
  });

  it('does not autoplay when reduced motion is preferred', () => {
    vi.useFakeTimers();
    mockReducedMotion(true);
    render(
      <Stepper
        autoplay
        id="release-flow"
        interval_ms={1000}
        steps={[
          { caption: 'First step.', body: 'First details.' },
          { caption: 'Second step.', body: 'Second details.' },
        ]}
      />,
    );

    act(() => vi.advanceTimersByTime(2000));

    expect(screen.getByText('First step.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play playback' })).toBeInTheDocument();
  });
});