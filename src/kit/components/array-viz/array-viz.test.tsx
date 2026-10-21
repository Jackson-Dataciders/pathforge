import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ArrayViz } from './ArrayViz';

describe('ArrayViz', () => {
  it('shows the initial values and advances values and highlights', async () => {
    const user = userEvent.setup();
    render(
      <ArrayViz
        id="bubble-sort-pass"
        initial={[3, 1]}
        kind="array"
        steps={[
          { caption: 'Swap the out-of-order values.', op: { type: 'swap', i: 0, j: 1 } },
          { caption: 'The smaller value is in place.', op: { type: 'highlight', indices: [0] } },
        ]}
      />,
    );

    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Values: 3, 1');
    expect(screen.getByText('Index 0: 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Values: 1, 3');

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('Highlighted indices: 0');
    expect(screen.getByText('The smaller value is in place.')).toBeInTheDocument();
  });
});