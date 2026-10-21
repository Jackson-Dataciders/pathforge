import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GraphCanvas } from './GraphCanvas';

afterEach(() => vi.unstubAllGlobals());

describe('GraphCanvas', () => {
  it('updates the caption and highlighted node labels when stepped', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });

    render(
      <GraphCanvas
        directed
        edges={[{ from: 'start', to: 'next' }]}
        id="graph-step-test"
        layout="layered"
        nodes={[
          { id: 'start', label: 'Start' },
          { id: 'next', label: 'Next node' },
        ]}
        steps={[
          { caption: 'Visit the start.', highlight_nodes: ['start'] },
          { caption: 'Continue to the next node.', highlight_nodes: ['next'], highlight_edges: [['start', 'next']] },
        ]}
      />,
    );

    expect(screen.getByText('Highlighted nodes: none.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('Highlighted nodes: Start.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'graph-step-test: Visit the start.' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('Highlighted nodes: Next node.')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'graph-step-test: Continue to the next node.' })).toBeInTheDocument();
  });
});