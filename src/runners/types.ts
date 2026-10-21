export const SUPPORTED_CODE_LANGUAGES = ['javascript', 'typescript'] as const;

export type RunRequest = {
  language: string;
  code: string;
  tests: string;
  timeoutMs: number;
};

export type TestResult = {
  name: string;
  passed: boolean;
  message?: string;
};

export type RunResult = {
  status: 'passed' | 'failed' | 'error' | 'timeout';
  tests: TestResult[];
  stdout: string;
  stderr: string;
  durationMs: number;
};

export type Runner = {
  id: string;
  languages: string[];
  run(request: RunRequest): Promise<RunResult>;
};

export type BrowserRunner = Runner;
export type NodeRunner = Runner;