import { describe, expect, it } from 'vitest';
import { getNodeRunner, isSupportedCodeLanguage } from '../registry';
import type { RunRequest } from '../types';

const runner = getNodeRunner('python');
const testTimeoutMs = 60_000;

function request(overrides: Partial<RunRequest> = {}): RunRequest {
  return {
    language: 'python',
    code: 'def add(a, b):\n    return a + b',
    tests: 'def test_adds():\n    assert add(2, 3) == 5',
    timeoutMs: testTimeoutMs,
    ...overrides,
  };
}

describe('Python Node runner', () => {
  it('is registered as a supported code language', () => {
    expect(isSupportedCodeLanguage('python')).toBe(true);
    expect(runner).toBeDefined();
  });

  it('runs a passing solution', async () => {
    const result = await runner!.run(request());

    expect(result.status).toBe('passed');
    expect(result.tests).toEqual([{ name: 'test_adds', passed: true }]);
  }, testTimeoutMs);

  it('reports a failing assertion message', async () => {
    const result = await runner!.run(
      request({ tests: 'def test_adds():\n    assert add(2, 3) == 6, "sum should be six"' }),
    );

    expect(result.status).toBe('failed');
    expect(result.tests).toEqual([{ name: 'test_adds', passed: false, message: 'sum should be six' }]);
  }, testTimeoutMs);

  it('returns an error for syntax errors', async () => {
    const result = await runner!.run(request({ code: 'def add(:' }));

    expect(result.status).toBe('error');
    expect(result.stderr).toContain('SyntaxError');
  }, testTimeoutMs);

  it('times out an infinite loop', async () => {
    const timeoutMs = 5000;
    const startedAt = Date.now();
    const result = await runner!.run(request({ code: 'while True:\n    pass', timeoutMs }));

    expect(result.status).toBe('timeout');
    expect(Date.now() - startedAt).toBeLessThan(timeoutMs + 1000);
  }, testTimeoutMs);

  it('captures stdout', async () => {
    const result = await runner!.run(request({ code: "print('answer', 5)\ndef add(a, b):\n    return a + b" }));

    expect(result.status).toBe('passed');
    expect(result.stdout).toBe('answer 5\n');
  }, testTimeoutMs);

  it('returns an error when no test functions are defined', async () => {
    const result = await runner!.run(request({ tests: '# no tests' }));

    expect(result.status).toBe('error');
    expect(result.stderr).toContain('No test_* functions were defined');
  }, testTimeoutMs);
});