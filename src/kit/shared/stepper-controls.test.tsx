import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StepperControls } from './stepper-controls';

describe('StepperControls', () => {
  it('supports buttons and arrow-key navigation with an accessible step indicator', async () => {
    const user = userEvent.setup();
    const next = vi.fn();
    const prev = vi.fn();
    const play = vi.fn();
    const pause = vi.fn();
    render(
      <StepperControls
        count={3}
        index={1}
        next={next}
        pause={pause}
        play={play}
        playing={false}
        prev={prev}
      />,
    );

    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    screen.getByRole('group', { name: 'Stepper controls' }).focus();
    await user.keyboard('{ArrowLeft}{ArrowRight}');
    await user.click(screen.getByRole('button', { name: 'Play playback' }));

    expect(prev).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
    expect(pause).not.toHaveBeenCalled();
  });
});