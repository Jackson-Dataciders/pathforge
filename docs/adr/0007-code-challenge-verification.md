---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/010-kit-code-challenge-and-javascript-runner.md
  - ../specs/011-kit-python-runner.md
  - ../specs/022-course-planner-agent.md
  - ../specs/026-course-validation.md
  - ../specs/029-kit-remote-execution-and-cpp-runner.md
  - ../specs/030-kit-rust-runner.md
  - ../specs/031-kit-csharp-runner.md
tags:
  - kit
  - runners
---
# ADR-0007: Code-challenge verification

## Summary
We verify code challenges in the browser where a browser runtime exists (JavaScript and TypeScript natively, Python via Pyodide) and, for compiled languages without a practical browser runtime (C++, Rust, C#), through a server-side proxy to the public Compiler Explorer execution API, while validation in CI runs every language with the same test harness on the runner itself. This keeps JavaScript, TypeScript, and Python free of servers and third parties, and still makes Rust, C#, and C++ available without hosting our own execution service.

## Context
- Code challenges must verify answers automatically, per course `code_language`.
- Requested languages: JavaScript, TypeScript, Python, C++, Rust, and C#.
- There is no backend besides Vercel functions and no external database; the platform is single-user.
- Validation must prove each challenge's reference solution passes its tests before a course is merged.
- Browser runtimes: JavaScript runs natively; TypeScript can be transpiled in the browser; Python has Pyodide. Compiling C++, Rust, or C# in the browser would require shipping a compiler toolchain as WebAssembly (tens of megabytes, experimental for Rust, a custom Roslyn/.NET build for C#).
- Vercel functions have no C++, Rust, or .NET toolchains.
- Options:
  - A: in-browser execution only.
  - B: a self-hosted sandboxed execution service (Judge0 or Piston) for all or some languages.
  - C: hybrid — in-browser for JS/TS/Python; compiled languages via the public Compiler Explorer (godbolt.org) execution API, called through our own API route.

## Decision
- We use option C.
- `src/runners/types.ts` defines `Runner { id; languages; run({ code, tests, timeoutMs }): Promise<RunResult> }`, where `RunResult = { status: 'passed' | 'failed' | 'error' | 'timeout'; tests: { name; passed; message? }[]; stdout; stderr; durationMs }`.
- Every language has a harness that wraps learner code and tests and prints one machine-readable result line (`PATHFORGE_RESULT <json>`) or returns the same structure directly. The harness source is shared between browser, proxy, and CI so results agree.
- Browser runners:
  - `javascript`, `typescript`: Web Worker; TypeScript transpiled with `sucrase`; tests use an injected `test`/`assert` API.
  - `python`: Pyodide in a Web Worker; tests are `def test_*()` functions with `assert`.
  - `cpp`, `rust`, `csharp`: the browser posts `{ language, code, tests }` to `POST /api/run`, which builds the harness program and calls Compiler Explorer's `/api/compiler/<id>/compile` with execution enabled, using a fixed compiler id per language from `src/runners/remote/compilers.ts`. The route allows only these languages, limits payload size, and applies a per-IP rate limit. It does not require login.
- CI runners (validation): JavaScript and TypeScript via `node:vm`; Python via Pyodide in Node; C++ via `g++ -std=c++20`, Rust via `rustc --edition 2021`, C# via `dotnet` (.NET 8) — installed in the workflow with pinned versions, each run in a temporary directory with a timeout.
- `src/runners/registry.ts` lists supported languages: `javascript`, `typescript`, `python`, `cpp`, `rust`, `csharp`, plus `none` for courses without code. Unsupported languages fail at the planning gate.
- Compiler Explorer compiler ids and their availability for execution are verified when implementing each compiled-language spec; if a language has no execution support there, that spec stops and reports instead of substituting another service.

## Alternatives considered
- A (browser only): C++, Rust, and C# would be unavailable or require very large, experimental WebAssembly toolchains.
- B (self-hosted service): reliable and private, but needs a server, maintenance, and cost for a single user.
- Calling Compiler Explorer directly from the browser: depends on CORS and exposes no place for rate limiting; the API route avoids both.

## Consequences
- Compiled-language challenges depend on a free public service without an SLA; outages or rate limits make those challenges temporarily unrunnable in the browser (validation is unaffected because CI compiles locally).
- Learner code for compiled languages is sent to a third party (Compiler Explorer).
- Browser (Compiler Explorer) and CI (runner toolchain) compiler versions can differ; challenges must use standard-library-only, portable code.
- Pyodide downloads several megabytes on first use and is loaded only on lessons with Python challenges.
- Worker-based execution is isolated from the page but not a security sandbox; acceptable because only the owner's own content runs.
