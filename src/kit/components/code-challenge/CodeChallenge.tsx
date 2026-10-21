'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { javascriptBrowserRunner } from '../../../runners/javascript/browser';
import type { RunResult } from '../../../runners/types';
import { Markdown } from '../../markdown';
import { useReportResult } from '../../result-context';
import type { codeChallengeSchema } from './schema';
import type { z } from 'zod';

type CodeChallengeProps = z.infer<typeof codeChallengeSchema>;

const CodeEditor = dynamic(() => import('./CodeEditor').then((module) => module.CodeEditor), {
  ssr: false,
  loading: () => <div aria-label="Loading code editor" className="h-80 animate-pulse bg-surface" role="status" />,
});

function errorResult(error: unknown): RunResult {
  return {
    status: 'error',
    tests: [],
    stdout: '',
    stderr: error instanceof Error ? error.message : String(error),
    durationMs: 0,
  };
}

export function CodeChallenge({
  id,
  title,
  prompt,
  language,
  starter,
  solution,
  tests,
  hints,
  timeout_ms,
}: CodeChallengeProps) {
  const reportResult = useReportResult();
  const storageKey = `pathforge:code-challenge:${id}`;
  const [code, setCode] = useState(() => {
    try {
      return window.sessionStorage.getItem(storageKey) ?? starter;
    } catch {
      return starter;
    }
  });
  const [result, setResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [visibleHints, setVisibleHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  function updateCode(value: string) {
    setCode(value);
    try {
      window.sessionStorage.setItem(storageKey, value);
    } catch {
      // Storage is optional; editing remains available when it is blocked.
    }
  }

  async function runTests() {
    setIsRunning(true);
    try {
      const nextResult = await javascriptBrowserRunner.run({
        language,
        code,
        tests,
        timeoutMs: timeout_ms,
      });
      setResult(nextResult);
      setHasRun(true);
      reportResult({ blockId: id, kind: 'code-challenge', passed: nextResult.status === 'passed' });
    } catch (error) {
      const nextResult = errorResult(error);
      setResult(nextResult);
      setHasRun(true);
      reportResult({ blockId: id, kind: 'code-challenge', passed: false });
    } finally {
      setIsRunning(false);
    }
  }

  function reset() {
    updateCode(starter);
    setResult(null);
    setHasRun(false);
    setShowSolution(false);
  }

  const statusLabel = result
    ? result.status === 'passed'
      ? 'All tests passed'
      : result.status === 'failed'
        ? 'Tests failed'
        : result.status === 'timeout'
          ? 'Timed out'
          : 'Runtime error'
    : '';

  return (
    <section aria-label={title} className="my-6 space-y-4">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-fg">{title}</h2>
        <div className="text-sm leading-6 text-fg">
          <Markdown>{prompt}</Markdown>
        </div>
      </header>

      <div className="overflow-hidden rounded border border-border">
        <CodeEditor code={code} language={language} onChange={updateCode} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded border border-accent bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isRunning}
          onClick={runTests}
          type="button"
        >
          {isRunning ? 'Running tests...' : 'Run tests'}
        </button>
        <button
          className="rounded border border-border px-3 py-2 text-sm text-fg disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isRunning}
          onClick={reset}
          type="button"
        >
          Reset
        </button>
        <button
          className="rounded border border-border px-3 py-2 text-sm text-fg disabled:cursor-not-allowed disabled:opacity-50"
          disabled={visibleHints >= hints.length}
          onClick={() => setVisibleHints((current) => Math.min(current + 1, hints.length))}
          type="button"
        >
          Show hint
        </button>
        <button
          className="rounded border border-border px-3 py-2 text-sm text-fg disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasRun}
          onClick={() => setShowSolution((current) => !current)}
          type="button"
        >
          {showSolution ? 'Hide solution' : 'Show solution'}
        </button>
      </div>

      {visibleHints > 0 ? (
        <ol className="list-decimal space-y-2 pl-6 text-sm text-fg">
          {hints.slice(0, visibleHints).map((hint, index) => (
            <li key={`${id}-hint-${index}`}>
              <Markdown>{hint}</Markdown>
            </li>
          ))}
        </ol>
      ) : null}

      {showSolution ? (
        <pre className="overflow-x-auto rounded border border-border bg-surface p-4 text-sm text-fg">
          <code>{solution}</code>
        </pre>
      ) : null}

      {result ? (
        <div aria-live="polite" className="space-y-3 border-t border-border pt-4">
          <h3 className={`font-semibold ${result.status === 'passed' ? 'text-success' : 'text-danger'}`}>
            {statusLabel}
          </h3>
          <ul className="space-y-2 text-sm">
            {result.tests.map((test, index) => (
              <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1" key={`${test.name}-${index}`}>
                <span className="font-medium text-fg">{test.name}</span>
                <span className={test.passed ? 'text-success' : 'text-danger'}>{test.passed ? 'Passed' : 'Failed'}</span>
                {test.message ? <span className="text-muted">{test.message}</span> : null}
              </li>
            ))}
          </ul>
          {result.stdout ? (
            <div>
              <h4 className="text-sm font-medium text-fg">Output</h4>
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-muted">{result.stdout}</pre>
            </div>
          ) : null}
          {result.stderr ? (
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-danger">{result.stderr}</pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}