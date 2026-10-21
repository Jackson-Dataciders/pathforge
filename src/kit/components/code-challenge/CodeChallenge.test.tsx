import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';

vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('../../../runners/javascript/browser', () => ({
  javascriptBrowserRunner: { run: vi.fn() },
}));

import { javascriptBrowserRunner } from '../../../runners/javascript/browser';
import type { RunResult } from '../../../runners/types';
import { KitResultProvider } from '../../result-context';
import { CodeChallenge } from './CodeChallenge';
import { codeChallengeSchema } from './schema';

const passingResult: RunResult = {
  status: 'passed',
  tests: [{ name: 'adds positive numbers', passed: true }],
  stdout: '',
  stderr: '',
  durationMs: 1,
};

const failingResult: RunResult = {
  status: 'failed',
  tests: [{ name: 'adds positive numbers', passed: false, message: 'Expected 0 to equal 5' }],
  stdout: '',
  stderr: '',
  durationMs: 1,
};

function renderChallenge(report = vi.fn()) {
  render(
    <KitResultProvider report={report}>
      <CodeChallenge
        hints={['Try addition.']}
        id="sum-two-numbers"
        language="javascript"
        prompt="Write a sum function."
        solution={'function sum(a, b) {\n  return a + b;\n}'}
        starter={'function sum(a, b) {\n  return 0;\n}'}
        tests="test('adds positive numbers', () => assert.equal(sum(2, 3), 5));"
        timeout_ms={5000}
        title="Add two numbers"
      />
    </KitResultProvider>,
  );
  return report;
}

describe('CodeChallenge', () => {
  beforeEach(() => {
    vi.mocked(javascriptBrowserRunner.run).mockReset();
    window.sessionStorage.clear();
  });
  afterEach(cleanup);

  it('rejects languages without a runner', () => {
    const result = codeChallengeSchema.safeParse({
      id: 'unsupported-language',
      title: 'Unsupported',
      prompt: 'Implement it.',
      language: 'ruby',
      starter: '',
      solution: '',
      tests: '',
    });

    expect(result.success).toBe(false);
  });

  it('validates the Python example against the code-challenge schema', () => {
    const example = parse(readFileSync(resolve('src/kit/components/code-challenge/example-python.yaml'), 'utf8'));

    expect(codeChallengeSchema.safeParse(example).success).toBe(true);
  });

  it('shows passing test results and gates solution reveal until the first run', async () => {
    const user = userEvent.setup();
    const report = renderChallenge();
    vi.mocked(javascriptBrowserRunner.run).mockResolvedValue(passingResult);

    const solutionButton = screen.getByRole('button', { name: 'Show solution' });
    expect(solutionButton).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Run tests' }));

    expect(await screen.findByText('All tests passed')).toBeInTheDocument();
    expect(screen.getByText('adds positive numbers')).toBeInTheDocument();
    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(report).toHaveBeenCalledWith({ blockId: 'sum-two-numbers', kind: 'code-challenge', passed: true });
    expect(solutionButton).toBeEnabled();

    await user.click(solutionButton);
    expect(screen.getByText(/return a \+ b;/)).toBeInTheDocument();
  });

  it('shows failing test details and reports a failing result', async () => {
    const user = userEvent.setup();
    const report = renderChallenge();
    vi.mocked(javascriptBrowserRunner.run).mockResolvedValue(failingResult);

    await user.click(screen.getByRole('button', { name: 'Run tests' }));

    expect(await screen.findByText('Tests failed')).toBeInTheDocument();
    expect(screen.getByText('Expected 0 to equal 5')).toBeInTheDocument();
    expect(report).toHaveBeenCalledWith({ blockId: 'sum-two-numbers', kind: 'code-challenge', passed: false });
  });
});