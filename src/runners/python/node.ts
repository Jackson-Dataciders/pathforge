import { fork, type ChildProcess } from 'node:child_process';
import { resolve as resolvePath } from 'node:path';
import type { NodeRunner, RunRequest, RunResult } from '../types';

function errorResult(error: unknown, durationMs: number): RunResult {
  return {
    status: 'error',
    tests: [],
    stdout: '',
    stderr: error instanceof Error ? error.message : String(error),
    durationMs,
  };
}

export const pythonNodeRunner: NodeRunner = {
  id: 'python-node',
  languages: ['python'],
  run(request: RunRequest): Promise<RunResult> {
    const startedAt = Date.now();

    return new Promise((resolve) => {
      let child: ChildProcess;
      try {
        child = fork(resolvePath(process.cwd(), 'src/runners/python/node-child.ts'), [], {
          execArgv: ['--import', 'tsx'],
          stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        });
      } catch (error) {
        resolve(errorResult(error, Date.now() - startedAt));
        return;
      }

      let settled = false;
      let childStderr = '';
      const finish = (result: RunResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (child.connected) child.disconnect();
        if (!child.killed) child.kill();
        resolve(result);
      };

      child.stderr?.setEncoding('utf8').on('data', (chunk: string) => {
        childStderr += chunk;
      });
      child.on('message', (message: RunResult) => finish(message));
      child.on('error', (error) => finish(errorResult(error, Date.now() - startedAt)));
      child.on('close', (code, signal) => {
        if (settled) return;
        finish({
          status: 'error',
          tests: [],
          stdout: '',
          stderr: childStderr || `Runner process exited (${signal || code}).`,
          durationMs: Date.now() - startedAt,
        });
      });

      const timeout = setTimeout(() => {
        finish({
          status: 'timeout',
          tests: [],
          stdout: '',
          stderr: `Execution exceeded ${request.timeoutMs} ms.`,
          durationMs: Date.now() - startedAt,
        });
      }, request.timeoutMs);

      child.send(request, (error) => {
        if (error) finish(errorResult(error, Date.now() - startedAt));
      });
    });
  },
};