import type { BrowserRunner, RunRequest, RunResult } from '../types';

type PythonBrowserRunner = BrowserRunner & {
  readonly isLoaded: boolean;
  run(request: RunRequest, onReady?: () => void): Promise<RunResult>;
};

type WorkerResponse = { type: 'ready' } | { type: 'result'; result: RunResult };

const PYODIDE_LOAD_TIMEOUT_MS = 60_000;

let worker: Worker | undefined;
let workerLoaded = false;
let pendingRun:
  | {
      resolve: (result: RunResult) => void;
      onReady?: () => void;
      startedAt: number;
      timeout: ReturnType<typeof setTimeout>;
      request: RunRequest;
    }
  | undefined;
let runQueue = Promise.resolve();

function errorResult(error: unknown, durationMs: number): RunResult {
  return {
    status: 'error',
    tests: [],
    stdout: '',
    stderr: error instanceof Error ? error.message : String(error),
    durationMs,
  };
}

function resetWorker(): void {
  worker?.terminate();
  worker = undefined;
  workerLoaded = false;
}

function execute(request: RunRequest, onReady?: () => void): Promise<RunResult> {
  const startedAt = performance.now();

  return new Promise((resolve) => {
    try {
      worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    } catch (error) {
      resolve(errorResult(error, performance.now() - startedAt));
      return;
    }

    const activeWorker = worker;
    const finish = (result: RunResult) => {
      if (!pendingRun) return;
      clearTimeout(pendingRun.timeout);
      pendingRun = undefined;
      resolve(result);
    };

    const timeoutRun = () => {
      finish({
        status: 'timeout',
        tests: [],
        stdout: '',
        stderr: `Execution exceeded ${request.timeoutMs} ms.`,
        durationMs: performance.now() - startedAt,
      });
      resetWorker();
    };
    const timeout = setTimeout(timeoutRun, workerLoaded ? request.timeoutMs : PYODIDE_LOAD_TIMEOUT_MS);

    pendingRun = { resolve, onReady, startedAt, timeout, request };
    activeWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === 'ready') {
        workerLoaded = true;
        pendingRun?.onReady?.();
        clearTimeout(pendingRun?.timeout);
        if (pendingRun) pendingRun.timeout = setTimeout(timeoutRun, request.timeoutMs);
        return;
      }
      finish(event.data.result);
    };
    activeWorker.onerror = (event) => {
      const result = errorResult(event.message, performance.now() - startedAt);
      resetWorker();
      finish(result);
    };
    activeWorker.postMessage(request);
  });
}

export const pythonBrowserRunner: PythonBrowserRunner = {
  id: 'python-browser',
  languages: ['python'],
  get isLoaded() {
    return workerLoaded;
  },
  run(request: RunRequest, onReady?: () => void) {
    const result = runQueue.then(() => execute(request, onReady));
    runQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  },
};