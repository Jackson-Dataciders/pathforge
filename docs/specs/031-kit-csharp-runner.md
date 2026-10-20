---
status: planned
priority: low
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0007-code-challenge-verification.md
tags:
  - kit
  - runners
depends_on:
  - 029-kit-remote-execution-and-cpp-runner.md
---
# Spec: 031-kit-csharp-runner

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Courses can use C# as their code language. C# challenges run through the remote execution route (Compiler Explorer) in the browser, and during validation with a local .NET SDK when installed (always in CI) or Compiler Explorer otherwise, using the same test harness. Tests are static methods whose names start with `Test`, using a small built-in `Assert` helper.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. Verify Compiler Explorer support for C# execution as in spec 029 step 1 (`/api/compilers/csharp`, a .NET 8 or newer compiler), record fixtures in `src/runners/remote/__fixtures__/csharp-*.json`; if no C# compiler supports execution, stop and report (do not substitute another service).
2. `compilers.ts`: `csharp` entry with the recorded compiler id and `ceLang: 'csharp'`.
3. `src/runners/csharp/harness.ts`: `buildCSharpProgram(code, tests)` producing one file: `using System; using System.Collections.Generic; using System.Linq; using System.Reflection; using System.Text;`, an `Assert` class (`Equal<T>`, `NotEqual<T>`, `True`, `False`, `Throws<TException>`) throwing `AssertionFailedException` with expected/actual text, the learner code (classes only, no top-level statements and no `Main`), the tests wrapped in `public static class Tests { ... }`, and a `PathforgeHarness.Main` that finds public static parameterless methods of `Tests` whose names start with `Test` (in declaration order via metadata token), invokes each, unwraps `TargetInvocationException`, and prints `PATHFORGE_RESULT <json>` (JSON built with `System.Text.Json`). Unit tests on the generated text.
4. `src/runners/csharp/node.ts`: CI runner that keeps a cached console project template in a temporary directory (created once per process with `dotnet new console --framework net8.0`), writes `Program.cs`, runs `dotnet run -c Release` with a 120 s build timeout and `timeoutMs` for execution (killing the process tree on timeout), and parses the result line. Register `csharp` in `nodeRunners`, `browserRunners` (remote runner), and `SUPPORTED_CODE_LANGUAGES`. Tests as in spec 029; local toolchain suite skipped without `dotnet` unless `CI` is set; without `dotnet` outside CI the runner falls back to Compiler Explorer via `local-or-remote.ts` (spec 029).
5. Workflows: in `ci.yml` and `pipeline-e2e.yml` add `actions/setup-dotnet` (pinned, `dotnet-version: 8.0.x`) and print `dotnet --version`.
6. Code challenge UI: C# highlighting via `@codemirror/legacy-modes` (`clike` `csharp`) wrapped in `StreamLanguage`.
7. Add `example-csharp.yaml`, show it on `/kit`, and extend `e2e/kit.spec.ts` with a mocked `/api/run` run. Add the C# case to the optional live test.

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- C# tests example:
  ```csharp
  public static void TestAdds() { Assert.Equal(5, Calculator.Add(2, 3)); }
  ```
- Only the .NET base class library is available; no NuGet packages.
- Status mapping matches spec 010.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- xUnit/NUnit, NuGet packages, or multi-project solutions.
- Other .NET languages (F#, VB).

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [ ] Compiler Explorer fixtures for C# execution are recorded from a real request and committed, or the spec is reported as blocked because execution is unsupported.
- [ ] Harness and C# Node runner tests pass in CI.
- [ ] `isSupportedCodeLanguage('csharp')` returns true and the manifest includes `csharp`; `npm run kit:manifest -- --check` passes.
- [ ] The C# example on `/kit` shows a passing result with the mocked `/api/run` (e2e).
- [ ] Manual: on the deployed site, running the C# example's solution shows "All tests passed".
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0007](../adr/0007-code-challenge-verification.md).
- New dependency: `@codemirror/legacy-modes`.
- Reuses `/api/run`, `compiler-explorer.ts`, `result-line.ts`, and the remote browser runner from spec 029.
