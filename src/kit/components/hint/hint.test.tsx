import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Hint } from './Hint';

describe('Hint', () => {
  it('starts collapsed and reveals its Markdown body on activation', async () => {
    const user = userEvent.setup();
    render(<Hint id="retry-strategy" label="Show hint" body="Use **bounded** retries." />);

    const details = screen.getByText('Show hint').closest('details');
    expect(details).not.toHaveAttribute('open');

    await user.click(screen.getByText('Show hint'));
    expect(details).toHaveAttribute('open');
    expect(screen.getByText('bounded').tagName).toBe('STRONG');
  });
});