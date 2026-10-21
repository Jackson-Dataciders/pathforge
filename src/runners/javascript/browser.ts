import type { BrowserRunner, RunRequest, RunResult } from '../types';

function errorResult(error: unknown, durationMs: number): RunResult {
  return {
    status: 'error',
    tests: [],
    stdout: '',
    stderr: error instanceof Error ? error.message : String(error),
    durationMs,
  };
}

export const javascriptBrowserRunner: BrowserRunner = {
  id: 'javascript-browser',
  languages: ['javascript', 'typescript'],
  run(request: RunRequest): Promise<RunResult> {
    const startedAt = performance.now();

    return new Promise((resolve) => {
      let worker: Worker;
      try {
        worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      } catch (error) {
        resolve(errorResult(error, performance.now() - startedAt));
        return;
      }

      const finish = (result: RunResult) => {
        clearTimeout(timeout);
        worker.terminate();
        resolve(result);
      };

      const timeout = setTimeout(() => {
        finish({
          status: 'timeout',
          tests: [],
          stdout: '',
          stderr: `Execution exceeded ${request.timeoutMs} ms.`,
          durationMs: performance.now() - startedAt,
        });
      }, request.timeoutMs);

      worker.onmessage = (event: MessageEvent<RunResult>) => finish(event.data);
      worker.onerror = (event) => finish(errorResult(event.message, performance.now() - startedAt));
      worker.postMessage(request);
    });
  },
};