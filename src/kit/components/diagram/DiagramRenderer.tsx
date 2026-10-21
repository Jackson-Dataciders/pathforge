'use client';

import { useEffect, useId, useState } from 'react';
import { useThemeTokens } from '@/theme/use-theme-tokens';

type MermaidRenderResult = { svg: string };
type MermaidConfig = {
  startOnLoad: false;
  securityLevel: 'strict';
  theme: 'base';
  themeVariables: Record<string, string>;
};

let renderQueue = Promise.resolve();

async function renderMermaid(id: string, code: string, config: MermaidConfig): Promise<MermaidRenderResult> {
  const render = renderQueue.then(async () => {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize(config);
    return mermaid.render(id, code);
  });
  renderQueue = render.then(() => undefined, () => undefined);
  return render;
}

export function DiagramRenderer({ code }: { code: string }) {
  const tokens = useThemeTokens();
  const reactId = useId();
  const renderKey = JSON.stringify([code, tokens]);
  const [renderResult, setRenderResult] = useState({ key: '', svg: '', error: '' });

  useEffect(() => {
    if (!tokens.bg || !tokens.fg || !tokens.accent || !tokens.border || !tokens.surface) return;

    let active = true;
    const themeVariables = {
      background: tokens.bg,
      primaryColor: tokens.surface,
      primaryTextColor: tokens.fg,
      primaryBorderColor: tokens.accent,
      lineColor: tokens.border,
      secondaryColor: tokens.surface,
      tertiaryColor: tokens.bg,
      textColor: tokens.fg,
      fontFamily: getComputedStyle(document.documentElement).fontFamily || 'sans-serif',
    };

    void renderMermaid(`diagram-${reactId.replace(/[^a-zA-Z0-9_-]/g, '-')}`, code, {
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables,
    }).then(
      (result) => {
        if (active) setRenderResult({ key: renderKey, svg: result.svg, error: '' });
      },
      (renderError: unknown) => {
        if (active) {
          setRenderResult({
            key: renderKey,
            svg: '',
            error: renderError instanceof Error ? renderError.message : String(renderError),
          });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [code, reactId, renderKey, tokens]);

  if (renderResult.key === renderKey && renderResult.error) {
    return (
      <div className="border border-danger bg-surface p-4 text-sm" role="alert">
        <p className="mb-2 font-semibold">Diagram could not be rendered: {renderResult.error}</p>
        <pre className="overflow-x-auto whitespace-pre-wrap"><code>{code}</code></pre>
      </div>
    );
  }

  if (renderResult.key !== renderKey || !renderResult.svg) {
    return <div aria-label="Loading diagram" className="h-48 animate-pulse bg-surface" role="status" />;
  }

  return <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: renderResult.svg }} />;
}