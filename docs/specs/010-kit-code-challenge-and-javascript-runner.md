---
status: planned
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0007-code-challenge-verification.md
  - ../adr/0006-kit-rendering-libraries.md
tags:
  - kit
  - assessment
  - runners
depends_on:
  - 006-component-kit-foundation.md
---
# Spec: 010-kit-code-challenge-and-javascript-runner

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Lessons can contain code challenges: a task, a code editor with starter code, and hidden tests that check my solution automatically when I click "Run tests". Each challenge also has a reference solution, which the pipeline later uses to prove the challenge is solvable. This spec builds the challenge component, a common runner interface for all programming languages, and the JavaScript and TypeScript runner for both the browser and Node.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/runners/types.ts`: `RunRequest { language, code, tests, timeoutMs }`, `TestResult { name, passed, message? }`, `RunResult { status: 'passed' | 'failed' | 'error' | 'timeout', tests: TestResult[], stdout, stderr, durationMs }`, `BrowserRunner { languages; run(req): Promise<RunResult> }`, `NodeRunner` with the same shape.
2. `src/runners/javascript/harness.ts`: `buildJavaScriptProgram(code, tests)` producing a script that defines `test(name, fn)` (supports async functions), an `assert` object (`ok`, `equal` (strict), `notEqual`, `deepEqual` (structural), `throws`), captures `console.log`/`console.error`, runs learner code then tests in one function scope, and posts a `RunResult`-compatible payload. `src/runners/javascript/transpile.ts`: TypeScript to JavaScript with `sucrase` (`transforms: ['typescript']`). `import`/`require` are rejected with an `error` result.
3. Browser runner `src/runners/javascript/browser.ts` + `worker.ts`: run the program in a dedicated Web Worker; terminate the worker on timeout and return `status: 'timeout'`.
4. Node runner `src/runners/javascript/node.ts`: run the program in a child process (`child_process.fork` of `node-child.ts` executed via `tsx`) using `node:vm` with a fresh context; kill the process on timeout.
5. `src/runners/registry.ts`: `browserRunners`, `nodeRunners`, `getBrowserRunner(lang)`, `getNodeRunner(lang)`, `SUPPORTED_CODE_LANGUAGES` (initially `javascript`, `typescript`), and `isSupportedCodeLanguage(lang)` (also true for `none`).
6. Tests `src/runners/javascript/node.test.ts`: passing solution, failing starter, syntax error → `error`, infinite loop → `timeout`, async test, TypeScript input, `require` rejected, captured stdout.
7. `src/kit/components/code-challenge/schema.ts`: `{ id, title, prompt (Markdown), language (supported language id), starter, solution, tests, hints: Markdown[] (0–5), timeout_ms: 1000–15000 = 5000 }`.
8. `src/kit/components/code-challenge/CodeChallenge.tsx` (client, dynamic import): CodeMirror 6 editor (`@uiw/react-codemirror`, `@codemirror/lang-javascript` with TypeScript flag) themed with tokens; buttons "Run tests", "Reset", "Show hint" (one at a time), and "Show solution" (enabled after the first run); result panel listing each test with pass/fail and message, stdout, and status. Calls `useReportResult()` with `{ blockId, kind: 'code-challenge', passed: status === 'passed' }` after each run. Editor contents persist in `sessionStorage` per block id (try/catch).
9. `example.yaml` (a small `sum(a, b)` task with three tests); register `code-challenge`; regenerate manifest.
10. Component tests with a mocked runner (run passes, run fails, solution reveal gating). Extend `e2e/kit.spec.ts`: paste the example solution, run tests, see "All tests passed".

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Tests are authored in the challenge's language and can call the learner's functions directly, e.g. `test('adds', () => assert.equal(sum(2, 3), 5))`.
- `status` is `passed` only if at least one test ran and all passed; `failed` if any assertion failed; `error` for syntax or runtime errors outside tests; `timeout` when `timeout_ms` is exceeded.
- Browser and Node runners return the same `RunResult` for the same input (apart from `durationMs`).
- A challenge whose `language` has no runner fails schema validation.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Python (spec 011) and any other language.
- Checking reference solutions across courses (spec 024 command, spec 026 validation).
- Saving results to the progress branch (spec 018).
- Package imports or multi-file challenges.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] Node runner tests cover all listed cases and pass, including `timeout` for `while (true) {}` within the configured timeout plus 1 s.
- [ ] The `/kit` code challenge example passes with the example solution and fails with the starter code (e2e).
- [ ] The UI shows each test's name and result after running.
- [ ] `getNodeRunner('typescript')` runs TypeScript code with type annotations successfully (test).
- [ ] `src/kit/manifest.json` includes `code-challenge`; `npm run kit:manifest -- --check` passes.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decisions: [ADR-0007](../adr/0007-code-challenge-verification.md) (runner interface, in-browser execution, same runners in CI), [ADR-0006](../adr/0006-kit-rendering-libraries.md) (CodeMirror 6).
- New dependencies: `@uiw/react-codemirror`, `@codemirror/lang-javascript`, `sucrase`.
- Web Worker files are bundled with `new Worker(new URL('./worker.ts', import.meta.url))`.
- The Node runner is used by `pipeline check-challenges` (spec 024) and validation (spec 026).
