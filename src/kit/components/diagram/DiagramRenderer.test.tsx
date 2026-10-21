import { cleanup, render, screen, waitFor } from '@testing-library/react';
import mermaid from 'mermaid';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagramRenderer } from './DiagramRenderer';

vi.mock('mermaid', () => ({
  default: { initialize: vi.fn(), render: vi.fn() },
}));

type MermaidResult = Awaited<ReturnType<typeof mermaid.render>>;

describe('DiagramRenderer', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.setProperty('--color-bg', 'white');
    document.documentElement.style.setProperty('--color-surface', 'whitesmoke');
    document.documentElement.style.setProperty('--color-fg', 'black');
    document.documentElement.style.setProperty('--color-accent', 'blue');
    document.documentElement.style.setProperty('--color-border', 'gray');
  });

  it('shows a loading state until Mermaid resolves', async () => {
    let resolveRender!: (result: MermaidResult) => void;
    vi.mocked(mermaid.render).mockImplementation(
      () => new Promise((resolve) => { resolveRender = resolve; }),
    );

    render(<DiagramRenderer code="flowchart LR\n  A --> B" />);

    await waitFor(() => expect(mermaid.render).toHaveBeenCalled());
    expect(screen.getByRole('status')).toBeInTheDocument();
    resolveRender({ svg: '<svg><text>Ready</text></svg>', diagramType: 'flowchart' });
    expect(await screen.findByText('Ready')).toBeInTheDocument();
  });

  it('renders Mermaid SVG on success', async () => {
    vi.mocked(mermaid.render).mockResolvedValue({ svg: '<svg data-testid="diagram-svg"></svg>', diagramType: 'flowchart' });

    const { container } = render(<DiagramRenderer code="flowchart LR\n  A --> B" />);

    await waitFor(() => expect(container.querySelector('svg[data-testid="diagram-svg"]')).toBeInTheDocument());
  });

  it('shows an inline error and the raw code on failure', async () => {
    vi.mocked(mermaid.render).mockRejectedValue(new Error('Invalid syntax'));
    const code = 'flowchart LR\n  A -->';

    render(<DiagramRenderer code={code} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid syntax');
    expect(alert.querySelector('code')?.textContent).toBe(code);
  });

  it('reinitializes Mermaid with updated colors when theme tokens change', async () => {
    vi.mocked(mermaid.render).mockResolvedValue({ svg: '<svg></svg>', diagramType: 'flowchart' });
    render(<DiagramRenderer code="flowchart LR\n  A --> B" />);
    await waitFor(() => expect(mermaid.initialize).toHaveBeenCalledTimes(1));

    document.documentElement.style.setProperty('--color-bg', 'black');
    document.documentElement.classList.add('dark');

    await waitFor(() => expect(mermaid.initialize).toHaveBeenCalledTimes(2));
    const configs = vi.mocked(mermaid.initialize).mock.calls.map(([config]) => config);
    expect(configs[0].themeVariables?.background).toBe('white');
    expect(configs[1].themeVariables?.background).toBe('black');
  });
});