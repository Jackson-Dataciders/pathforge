import { loadPyodide, type PyodideInterface } from 'pyodide';
import { buildPythonHarness } from './harness.py';
import { PYODIDE_INDEX_URL } from './config';
import type { RunRequest, RunResult } from '../types';

type HarnessResult = {
  tests: RunResult['tests'];
  stdout: string;
  stderr: string;
  error: string | null;
};

type WorkerResponse = { type: 'ready' } | { type: 'result'; result: RunResult };

let pyodidePromise: Promise<PyodideInterface> | undefined;

async function getPyodide(): Promise<PyodideInterface> {
  pyodidePromise ??= loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  try {
    return await pyodidePromise;
  } catch (error) {
    pyodidePromise = undefined;
    throw error;
  }
}

function errorResult(error: unknown, durationMs: number): RunResult {
  return {
    status: 'error',
    tests: [],
    stdout: '',
    stderr: error instanceof Error ? error.message : String(error),
    durationMs,
  };
}

self.addEventListener('message', (event: MessageEvent<RunRequest>) => {
  void run(event.data);
});

async function run(request: RunRequest): Promise<void> {
  const startedAt = performance.now();
  try {
    const pyodide = await getPyodide();
    self.postMessage({ type: 'ready' } satisfies WorkerResponse);
    const harnessResult = pyodide.runPython(buildPythonHarness(request.code, request.tests)) as string;
    const output = JSON.parse(harnessResult) as HarnessResult;
    const status = output.error
      ? 'error'
      : output.tests.length > 0 && output.tests.every((test) => test.passed)
        ? 'passed'
        : output.tests.length > 0
          ? 'failed'
          : 'error';
    const result: RunResult = {
      status,
      tests: output.tests,
      stdout: output.stdout,
      stderr: [output.stderr, output.error].filter(Boolean).join('\n'),
      durationMs: performance.now() - startedAt,
    };
    self.postMessage({ type: 'result', result } satisfies WorkerResponse);
  } catch (error) {
    self.postMessage({ type: 'result', result: errorResult(error, performance.now() - startedAt) } satisfies WorkerResponse);
  }
}