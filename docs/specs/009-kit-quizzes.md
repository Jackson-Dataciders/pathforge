---
status: done
priority: high
created: "2026-10-20"
work_item: ""
adr:
  - ../adr/0005-component-kit-contract-and-extension-policy.md
tags:
  - kit
  - assessment
depends_on:
  - 006-component-kit-foundation.md
---
# Spec: 009-kit-quizzes

## Description
<!-- Written by me: what the feature should do, in plain words. -->
Lessons can contain quizzes that check answers automatically. A quiz has one or more questions of type single choice, multiple choice, true/false, or short text answer. After checking, each question shows whether it was right plus an explanation, and the quiz reports whether it was passed so progress can be recorded later.

---
<!--
Sections below are completed by Copilot before implementation.
Base them only on the Description and the existing codebase/ADRs.
If something in the Description is ambiguous, list it under Open questions
instead of guessing, and do not start implementing until it is answered.
-->

## Implementation plan
<!-- Ordered steps. Each step: affected project/file and what changes. Small enough to verify individually. -->
1. `src/kit/components/quiz/schema.ts`:
   - Quiz: `{ id, title?, pass_threshold: 0–1 = 1, questions: Question[] (1–15) }`.
   - Question (discriminated by `type`): common `{ id, prompt (Markdown), explanation (Markdown) }`;
     `single`: `options: { id, text, correct: boolean }[]` (2–8, exactly one correct);
     `multiple`: same options, at least one correct;
     `boolean`: `answer: boolean`;
     `text`: `accepted: string[]` (1–10), `case_sensitive: boolean = false`.
   - Refinements: unique question ids, unique option ids per question.
2. `src/kit/components/quiz/grade.ts`: pure `gradeQuiz(quiz, answers)` → `{ score (0–1), passed, results: { questionId, correct }[] }`. Text answers are trimmed, internal whitespace collapsed, and compared case-insensitively unless `case_sensitive`. Multiple choice is correct only if the selected set equals the correct set. Unit tests for every type and edge case (empty answer, extra whitespace, partial multiple selection).
3. `src/kit/components/quiz/Quiz.tsx` (client): renders questions with radio, checkbox, true/false, or text input; "Check answers" button grades all questions; shows per-question correct/incorrect state with icon and text (not color alone) plus the explanation; shows score; "Try again" resets. On check, calls `useReportResult()` with `{ blockId: id, kind: 'quiz', passed }`.
4. `example.yaml` with one question of each type; register `quiz`; regenerate manifest.
5. Component tests: answering correctly shows passed and reports `passed: true`; wrong answer shows explanation and reports `passed: false`; retry clears state.
6. Extend `e2e/kit.spec.ts`: answer the example quiz correctly and see "Passed".

## Behavior
<!-- Concrete behavior derived from the Description: inputs, outputs, edge cases, error cases. -->
- "Check answers" is disabled until every question has an answer.
- Correct answers are part of the page payload; this is acceptable for a single-user learning tool.
- Result reporting happens on every check; the latest result wins.

## Out of scope
<!-- What this spec explicitly does NOT cover, to prevent overbuilding. -->
- Saving results to the progress branch (spec 018).
- Randomizing question or option order.
- Timed quizzes or scoring across lessons.

## Acceptance criteria
<!-- Checkable, testable statements. One per line as "- [ ]". Tick them when verified. -->
- [x] `grade.ts` unit tests cover single, multiple, boolean, and text questions including normalization, and pass.
- [x] Schema rejects a single-choice question with two correct options (test).
- [x] Component tests for pass, fail, and retry pass, including the reported result.
- [x] The `/kit` quiz example can be answered correctly and shows "Passed" (e2e).
- [x] `src/kit/manifest.json` includes `quiz`; `npm run kit:manifest -- --check` passes.
- [x] `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass.

## Technical notes
<!-- Affected projects/files, new dependencies, links to relevant ADRs. If a new architectural decision is needed, use the adr-writer skill. -->
- Decision: [ADR-0005](../adr/0005-component-kit-contract-and-extension-policy.md) (component contract, block ids for progress).
- Uses `Markdown` and `useReportResult` from spec 006. No new dependencies.
