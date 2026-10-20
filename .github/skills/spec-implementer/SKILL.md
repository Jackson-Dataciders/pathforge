---
name: spec-implementer
description: 'Implement a planned feature spec by following its ordered implementation plan, respecting scope, verifying acceptance criteria, and updating status. Use when asked to implement or execute a planned spec.'
argument-hint: 'Path to a planned spec file'
---

# Spec Implementer

Implement one feature spec from `docs/specs/` while keeping the spec as the source of truth.

## Preconditions

1. Read the complete spec, including frontmatter and all sections.
2. Stop without editing code or the spec unless `status` is exactly `planned`. Report the actual status and ask for the spec to be moved to `planned`.
3. Stop if `## Open questions` contains any unresolved question or substantive content. Ignore only blank lines and the section's HTML guidance comment. Report the questions and ask for answers; do not guess.
4. Confirm the spec has an ordered `## Implementation plan`, an `## Out of scope` section, and testable `## Acceptance criteria`. If any is missing or unusable, stop and report what needs to be completed.
5. Note the `work_item` value for commit and pull-request text. Do not invent or alter its identifier.

## Procedure

1. Once all preconditions pass, change the spec status from `planned` to `in-progress` before implementation.
2. Read the relevant architecture and nearby code/tests as required by repository instructions. Treat the spec's behavior, technical notes, and Out of scope section as constraints. Do not add out-of-scope work; if implementation appears to require it, stop and report the conflict.
3. Execute the Implementation plan in its written order. Do not skip, reorder, or silently broaden a step. For each step, make the smallest change that fulfills it, then run a focused check that can verify that change before moving to the next step.
4. Verify acceptance criteria against observable behavior, tests, or other direct evidence. Change a criterion from `- [ ]` to `- [x]` only after its verification succeeds. Keep unchecked criteria unchecked when verification is missing or fails, and report the evidence or blocker.
5. After all plan steps, run the relevant focused tests and checks. Revisit every acceptance criterion and confirm its checked state is supported by verification.
6. Set status to `done` only when every acceptance criterion is checked and verified. Otherwise leave status `in-progress`, keep unmet criteria unchecked, and report what remains.
7. When composing a commit message or pull-request description, include the spec's `work_item` reference: format the identifier as `#id` for GitHub or `AB#id` for Azure Boards. Preserve the supplied identifier; if the tracker or identifier is unclear, ask before composing that text. Do not create a commit or pull request unless requested.

## Reporting

Summarize the implemented plan steps, checks run and their results, acceptance criteria completed or remaining, the final spec status, and any blockers. If a precondition fails, report the exact gate and make no implementation changes.
