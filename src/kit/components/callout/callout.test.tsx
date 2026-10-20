import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Callout } from './Callout';

describe('Callout', () => {
  it('renders its title and Markdown body', () => {
    render(<Callout variant="tip" title="Remember" body="Status codes are **three digits**." />);

    expect(screen.getByRole('heading', { name: 'Remember' })).toBeInTheDocument();
    expect(screen.getByText('three digits').tagName).toBe('STRONG');
  });
});