import { buildJavaScriptProgram } from './harness';
import { transpileCode } from './transpile';
import type { RunRequest, RunResult } from '../types';

self.addEventListener('message', (event: MessageEvent<RunRequest>) => {
  const startedAt = Date.now();

  try {
    const code = transpileCode(event.data.language, event.data.code);
    const tests = transpileCode(event.data.language, event.data.tests);
    const program = buildJavaScriptProgram(code, tests);
    new Function(program)();
  } catch (error) {
    const result: RunResult = {
      status: 'error',
      tests: [],
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    };
    self.postMessage(result);
  }
});