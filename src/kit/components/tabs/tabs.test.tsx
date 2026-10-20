import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('supports arrow-key navigation and updates the selected panel', async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        id="formats"
        tabs={[
          { label: 'JSON', body: 'Structured data.' },
          { label: 'XML', body: 'Document data.' },
        ]}
      />,
    );

    const jsonTab = screen.getByRole('tab', { name: 'JSON' });
    const xmlTab = screen.getByRole('tab', { name: 'XML' });
    jsonTab.focus();
    await user.keyboard('{ArrowRight}');

    expect(xmlTab).toHaveAttribute('aria-selected', 'true');
    expect(xmlTab).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Document data.');
  });
});