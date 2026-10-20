---
status: planned
priority: medium
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0007-code-challenge-verification.md
tags:
  - kit
  - runners
depends_on:
  - 010-kit-code-challenge-and-javascript-runner.md
---
# Spec: 011-kit-python-runner

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Code challenges also work for courses whose code language is Python. Python code runs in the browser via Pyodide, and the pipeline uses the same Pyodide runtime in Node to verify reference solutions. Tests are plain `test_*` functions with `assert`.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Add dependency `pyodide` (pinned exact version) and `@codemirror/lang-python`. Define `PYODIDE_VERSION` and `PYODIDE_INDEX_URL` (`https://cdn.jsdelivr.net/pyodide/v<version>/full/`) in `src/runners/python/config.ts`.
2. `src/runners/python/harness.py.ts`: export a Python source string that, given `code` and `tests` strings, redirects `sys.stdout`/`sys.stderr` to buffers, executes `code` in a fresh namespace dict, executes `tests` in the same namespace, collects functions named `test_*` in definition order, runs each catching `AssertionError` (message = assertion text or `repr`) and other exceptions (message = exception type and text), and returns a JSON string `{ tests, stdout, stderr, error }`.
3. Browser runner `src/runners/python/browser.ts` + `worker.ts`: the worker loads Pyodide once from `PYODIDE_INDEX_URL` (cached across runs while the page lives), runs the harness, posts the result; the main thread terminates and recreates the worker on timeout. First load shows "Loading Python…" in the challenge UI.
4. Node runner `src/runners/python/node.ts`: child process that loads Pyodide from the npm package (`loadPyodide()`), runs the harness, prints the JSON result; killed on timeout.
5. Register `python` in `src/runners/registry.ts` (`SUPPORTED_CODE_LANGUAGES` now includes `python`); the code-challenge editor picks `@codemirror/lang-python` for `language: python`.
6. Add `src/kit/components/code-challenge/example-python.yaml` (used only in tests and on `/kit` as a second example) and render it on `/kit`.
7. Tests `src/runners/python/node.test.ts` (test timeout 60 s): passing solution, failing assertion with message, syntax error → `error`, infinite loop → `timeout`, stdout captured, no `test_*` functions → `error`.
8. Extend `e2e/kit.spec.ts`: run the Python example with its solution and see "All tests passed" (allow up to 60 s for Pyodide load).

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- Python tests example:
  ```python
  def test_adds():
      assert add(2, 3) == 5
  ```
- Status mapping matches spec 010: `passed`, `failed`, `error`, `timeout`.
- Only the Python standard library bundled with Pyodide is available; `micropip` installs are not performed.
- Pyodide loads only on pages with a Python challenge.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Installing third-party Python packages.
- Other languages.
- Offline caching of Pyodide assets.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] Python Node runner tests cover all listed cases and pass.
- [ ] The Python example on `/kit` passes with its solution in the browser (e2e).
- [ ] `isSupportedCodeLanguage('python')` returns true (test).
- [ ] The Python code-challenge schema example validates and the manifest lists `python` in the `language` enum; `npm run kit:manifest -- --check` passes.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0007](../adr/0007-code-challenge-verification.md).
- New dependencies: `pyodide`, `@codemirror/lang-python`.
- Keep the browser and Node harness identical (same Python source string) so results match.
