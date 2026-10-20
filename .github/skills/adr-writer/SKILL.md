---
name: adr-writer
description: 'Create Architecture Decision Records from a spec file or decision description. Use when starting a new project or layer, adding a dependency or framework, changing data flow, adding an integration, or replacing an existing pattern.'
argument-hint: 'A spec file path or a decision description'
---

# ADR Writer

Create a proposed Architecture Decision Record that follows this repository's ADR template and links the decision to related specifications.

## Input

Accept either a spec file path or a decision description. Read the supplied spec or description and identify the decision, context, constraints, alternatives, and likely consequences. Do not invent a decision that the input does not support. If the decision or a material constraint is unclear, ask a concise question before writing the ADR.

## Triggers

Use this skill when a decision concerns:
- A new project or architectural layer
- A new dependency or framework
- A changed data flow
- A new integration
- Replacing an existing pattern

## Procedure

1. Inspect `docs/_templates/adr-template.md`, the ADR filenames in `docs/adr/`, and relevant specs in `docs/specs/`.
2. Identify the next unused four-digit ADR number from the existing numbered ADRs. Use `0001` when there are none. Create the filename as `NNNN-short-kebab-title.md` in `docs/adr/`.
3. Copy the ADR template and replace every placeholder. Remove template guidance comments from the completed ADR and fill each section using only supported information; call out unknowns rather than fabricating details.
4. Set `status: proposed` and set `date` to the current date in `YYYY-MM-DD` format. Keep all required frontmatter fields, using YAML lists for list-valued fields.
5. Write the Summary as exactly two sentences: the first states what was decided, and the second states why. Keep each sentence focused on that purpose.
6. Add related spec paths to the `specs` frontmatter list, using relative paths to files in `docs/specs/`. Link those specs with relative Markdown links when mentioning them in the ADR body. If no related spec exists, leave the list empty.
7. If the decision replaces an existing ADR, set the new ADR's `supersedes` field to that ADR's relative path and update the existing ADR's `superseded_by` field to this new ADR's relative path. Do not change the existing ADR's decision text or status. If no ADR is being replaced, leave both fields empty on the new ADR.
7. If the decision replaces an existing ADR, set the new ADR's `supersedes` field to the predecessor's repository-relative path (for example, `docs/adr/0001-example.md`) and update the predecessor's `superseded_by` field to the new ADR's repository-relative path. Do not change the existing ADR's decision text or status. If no ADR is being replaced, leave both fields empty on the new ADR.
8. Check that the filename and heading use the same ADR number, all placeholders are gone, the summary has exactly two sentences, dates and relative links are valid, and supersession metadata is reciprocal where applicable.
8. Check that the filename and heading use the same ADR number, all placeholders are gone, the summary has exactly two sentences, dates and relative links are valid, and supersession paths are repository-relative, resolve to the intended ADRs, and are reciprocal where applicable.

## Completion

Report the created ADR path and number, the decision captured, related specs, and any unresolved questions or assumptions. Do not mark the ADR accepted; its status remains proposed.
