---
name: accept-adr
description: Accept an ADR, mark its explicitly superseded ADR as superseded, and record the decision in the architecture document.
argument-hint: Path to the ADR file to accept
agent: agent
---
Accept the ADR at `${input:adrFile}`.

1. Read the target ADR and [the architecture document](../../docs/architecture.md). Treat `supersedes` as an optional repository-relative path (for example, `docs/adr/0001-example.md`). If present, verify that it resolves to exactly one existing ADR under `docs/adr/`; reject IDs, absolute paths, paths outside the repository, and malformed or missing targets. Do not infer a predecessor from prose. Stop and ask for clarification if validation fails.
2. Set only the target ADR's `status` frontmatter value to `accepted`.
3. If the target explicitly supersedes a predecessor ADR, set its `status` frontmatter value to `superseded` and its `superseded_by` value to the target ADR's repository-relative path (for example, `docs/adr/0002-example.md`). Keep the reciprocal paths consistent.
4. Update `docs/architecture.md` to state the accepted decision and link to the target ADR using a relative Markdown link. Preserve existing architecture content and integrate the decision in the closest relevant section. If the document is empty, add a concise entry for the decision and its ADR link.

Change no other files or content. In particular, do not edit ADR metadata beyond the specified status and supersession fields, rewrite unrelated architecture content, or make implementation changes. After editing, report the files changed and the decision recorded.
