import { describe, expect, it } from 'vitest';
import { getNodeRunner } from '../registry';
import type { RunRequest } from '../types';

const runner = getNodeRunner('javascript');

function request(overrides: Partial<RunRequest> = {}): RunRequest {
  return {
    language: 'javascript',
    code: 'function sum(a, b) { return a + b; }',
    tests: "test('adds', () => assert.equal(sum(2, 3), 5));",
    timeoutMs: 5000,
    ...overrides,
  };
}

describe('JavaScript Node runner', () => {
  it('runs a passing solution', async () => {
    const result = await runner!.run(request());

    expect(result.status).toBe('passed');
    expect(result.tests).toEqual([{ name: 'adds', passed: true }]);
  });

  it('reports a failing starter', async () => {
    const result = await runner!.run(
      request({
        code: 'function sum() { return 0; }',
        tests: "test('adds', () => assert.equal(sum(2, 3), 5));",
      }),
    );

    expect(result.status).toBe('failed');
    expect(result.tests[0]).toMatchObject({ name: 'adds', passed: false });
  });

  it('returns an error for syntax errors', async () => {
    const result = await runner!.run(request({ code: 'function sum( {' }));

    expect(result.status).toBe('error');
    expect(result.stderr).not.toBe('');
  });

  it('times out an infinite loop within the configured timeout plus one second', async () => {
    const timeoutMs = 300;
    const startedAt = Date.now();
    const result = await runner!.run(request({ code: 'while (true) {}', timeoutMs }));

    expect(result.status).toBe('timeout');
    expect(Date.now() - startedAt).toBeLessThan(timeoutMs + 1000);
  });

  it('awaits asynchronous tests', async () => {
    const result = await runner!.run(
      request({
        tests: "test('async test', async () => { await Promise.resolve(); assert.equal(sum(1, 2), 3); });",
      }),
    );

    expect(result.status).toBe('passed');
  });

  it('runs TypeScript input with type annotations', async () => {
    const result = await getNodeRunner('typescript')!.run(
      request({
        language: 'typescript',
        code: 'function sum(a: number, b: number): number { return a + b; }',
        tests: "test('typed test', (): void => assert.equal(sum(1, 2), 3));",
      }),
    );

    expect(result.status).toBe('passed');
  });

  it('rejects require calls', async () => {
    const result = await runner!.run(request({ code: "const fs = require('node:fs');" }));

    expect(result.status).toBe('error');
    expect(result.stderr).toContain('require()');
  });

  it('captures stdout', async () => {
    const result = await runner!.run(request({ code: "console.log('answer', 5); function sum(a, b) { return a + b; }" }));

    expect(result.status).toBe('passed');
    expect(result.stdout).toBe('answer 5');
  });
});