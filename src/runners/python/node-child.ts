import { loadPyodide } from 'pyodide';
import { buildPythonHarness } from './harness.py';
import type { RunRequest, RunResult } from '../types';

type HarnessResult = {
  tests: RunResult['tests'];
  stdout: string;
  stderr: string;
  error: string | null;
};

function send(result: RunResult): void {
  if (!process.send) {
    process.exitCode = 1;
    return;
  }
  process.send(result, () => process.exit(0));
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

process.on('message', async (message: RunRequest) => {
  const startedAt = Date.now();
  try {
    const pyodide = await loadPyodide();
    const harnessResult = pyodide.runPython(buildPythonHarness(message.code, message.tests)) as string;
    const output = JSON.parse(harnessResult) as HarnessResult;
    const status = output.error
      ? 'error'
      : output.tests.length > 0 && output.tests.every((test) => test.passed)
        ? 'passed'
        : output.tests.length > 0
          ? 'failed'
          : 'error';
    send({
      status,
      tests: output.tests,
      stdout: output.stdout,
      stderr: [output.stderr, output.error].filter(Boolean).join('\n'),
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    send(errorResult(error, Date.now() - startedAt));
  }
});