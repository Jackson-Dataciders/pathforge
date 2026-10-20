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
  - 027-course-builder-agent.md
---
# Spec: 029-kit-remote-execution-and-cpp-runner

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Courses can use C++ as their code language. Because C++ cannot practically be compiled in the browser, the browser sends the code to our own API route, which runs it on the public Compiler Explorer (godbolt.org) service and returns the test results. Validation (on my machine when the course builder runs, and in CI) compiles and runs the same harness with a local `g++` when one is installed; on my machine it falls back to Compiler Explorer when no `g++` is found, so I do not have to install compilers. This spec builds the shared remote-execution infrastructure that Rust and C# reuse, plus the C++ runner.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Verify Compiler Explorer support: query `https://godbolt.org/api/compilers/c++` (with `Accept: application/json`), pick the newest stable GCC compiler id, send one execution request (see step 3) with a hello-world program, and confirm the response contains the program's stdout and exit code. Record the request and response as test fixtures in `src/runners/remote/__fixtures__/cpp-*.json`. If execution is not available, stop and report.
2. `src/runners/remote/result-line.ts`: `RESULT_PREFIX = 'PATHFORGE_RESULT '` and `parseResultLine(stdout)` → `{ tests, stdout }` (stdout without the result line) or `null` when missing. Unit tests.
3. `src/runners/remote/compilers.ts`: per language `{ ceCompilerId, ceLang, userArguments, ciCommand }`; for `cpp`: the GCC id from step 1, `ceLang: 'c++'`, `userArguments: '-std=c++20 -O1'`. `src/runners/remote/compiler-explorer.ts`: `executeOnCompilerExplorer({ language, source, timeoutMs })` → `POST https://godbolt.org/api/compiler/<id>/compile` with `{ source, lang, options: { userArguments, executeParameters: { args: [], stdin: '' }, compilerOptions: { executorRequest: true }, filters: { execute: true } } }`, maps compile errors to `status: 'error'` with compiler stderr, execution timeouts or fetch timeout (`timeoutMs` + 15 s) to `timeout`, and otherwise parses the result line. Unit tests with the recorded fixtures and mocked `fetch`.
4. `src/runners/cpp/harness.ts`: `buildCppProgram(code, tests)` producing one source file: a prelude (standard headers, a test registry, macros `TEST(name)`, `ASSERT_TRUE(cond)`, `ASSERT_EQ(a, b)`, `ASSERT_NE(a, b)`, `ASSERT_THROWS(expr)` that throw a failure exception with file, line, and the compared values via `std::ostringstream`), then the learner code, then the tests, then `main()` that runs every registered test, catches exceptions per test, and prints `PATHFORGE_RESULT <json>` with JSON-escaped names and messages. Unit test on the generated text.
5. `src/app/api/run/route.ts` (Node runtime): `POST { language, code, tests, timeoutMs }`; allows only languages with a `compilers.ts` entry; rejects bodies over 64 KB (413) and invalid input (400); applies a best-effort in-memory rate limit of 10 runs per minute per IP (429); builds the program with the language's harness, calls `executeOnCompilerExplorer`, returns `RunResult`. No login required. Route tests with mocked `executeOnCompilerExplorer`.
6. `src/runners/remote/browser.ts`: `remoteBrowserRunner(languages)` posting to `/api/run`; maps network failures to `status: 'error'` with message "Code execution service unavailable — try again later". Register `cpp` in `browserRunners`.
7. `src/runners/cpp/node.ts`: Node runner writing the program to a temporary directory, compiling with `g++ -std=c++20 -O1` (60 s compile timeout), running the binary with `timeoutMs`, and parsing the result line. If `g++` is not on `PATH` and `CI` is not set, it falls back to `executeOnCompilerExplorer` and logs "g++ not found, using Compiler Explorer"; in CI a missing toolchain is an error. Shared helper `src/runners/remote/local-or-remote.ts` implements this fallback for all compiled languages. Register `cpp` in `nodeRunners` and `SUPPORTED_CODE_LANGUAGES`. Tests: passing solution, failing assertion with message, compile error → `error`, infinite loop → `timeout`, captured stdout (local toolchain suite skipped when `g++` is missing unless `CI` is set); fallback selection tested with a mocked `PATH` check and mocked `executeOnCompilerExplorer`.
8. Code challenge UI: `@codemirror/lang-cpp` for `language: cpp`; while a remote run is in progress show "Running on Compiler Explorer…"; add a small note under remote-language challenges: "Code runs on godbolt.org".
9. Add `src/kit/components/code-challenge/example-cpp.yaml` and show it on `/kit`. Extend `e2e/kit.spec.ts` with a run of the C++ example where `/api/run` is mocked via `page.route` to return a passing result (UI wiring only).
10. Workflows: in `ci.yml` and `pipeline-e2e.yml` add a step printing `g++ --version` (preinstalled on `ubuntu-latest`) so the toolchain version is visible in logs.
11. Optional live test `src/runners/remote/compiler-explorer.live.test.ts`, run only with `RUN_LIVE_RUNNER_TESTS=1`, executing the C++ example's solution on godbolt.org.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- C++ tests example:
  ```cpp
  TEST(adds_numbers) { ASSERT_EQ(add(2, 3), 5); }
  ```
- Status mapping matches spec 010: `passed`, `failed`, `error` (including compile errors), `timeout`.
- Only the C++ standard library is available.
- If Compiler Explorer is down or rate-limits, the challenge shows an error result; nothing is recorded as passed.
- Validation (spec 026) automatically covers C++ challenges because it uses `getNodeRunner`.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Rust and C# (specs 030 and 031).
- Third-party libraries, multiple files, or stdin-driven challenges.
- A self-hosted execution service.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] Compiler Explorer fixtures for C++ are recorded from a real request (step 1) and committed.
- [ ] `result-line`, `compiler-explorer`, `harness`, and `/api/run` route tests pass, including 400, 413, and 429 responses.
- [ ] C++ Node runner tests pass in CI.
- [ ] `isSupportedCodeLanguage('cpp')` returns true and the manifest's code-challenge `language` enum includes `cpp`; `npm run kit:manifest -- --check` passes.
- [ ] The C++ example on `/kit` shows a passing result with the mocked `/api/run` (e2e).
- [ ] Manual: on the deployed site, running the C++ example's solution shows "All tests passed".
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0007](../adr/0007-code-challenge-verification.md) (hybrid execution, Compiler Explorer for compiled languages, local toolchains in CI).
- New dependency: `@codemirror/lang-cpp`.
- Learner code for compiled languages is sent to godbolt.org; this is accepted in ADR-0007.
- The rate limit is per serverless instance and therefore best effort.
