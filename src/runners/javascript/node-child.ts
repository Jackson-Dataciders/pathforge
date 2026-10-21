import { runInContext, createContext } from 'node:vm';
import { buildJavaScriptProgram } from './harness';
import { transpileCode } from './transpile';
import type { RunRequest, RunResult } from '../types';

function send(result: RunResult): void {
  if (!process.send) {
    process.exitCode = 1;
    return;
  }
  process.send(result, () => process.exit(0));
}

process.on('message', (message: RunRequest) => {
  const startedAt = Date.now();
  try {
    const code = transpileCode(message.language, message.code);
    const tests = transpileCode(message.language, message.tests);
    const sandbox = {
      postMessage: (result: RunResult) => send(result),
    };
    const context = createContext(sandbox);
    runInContext(buildJavaScriptProgram(code, tests), context, {
      timeout: message.timeoutMs,
    });
  } catch (error) {
    const timedOut =
      typeof error === 'object' && error !== null && 'code' in error && error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT';
    send({
      status: timedOut ? 'timeout' : 'error',
      tests: [],
      stdout: '',
      stderr: timedOut
        ? `Execution exceeded ${message.timeoutMs} ms.`
        : error instanceof Error
          ? error.stack || error.message
          : String(error),
      durationMs: Date.now() - startedAt,
    });
  }
});