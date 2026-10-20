---
status: accepted
date: 2026-10-20
supersedes: ""
superseded_by: ""
specs:
  - ../specs/019-roadmap-data-format.md
  - ../specs/020-roadmap-rendering-and-example-modal.md
  - ../specs/025-roadmap-agent.md
tags:
  - roadmap
  - dependencies
---
# ADR-0012: Roadmap data format and rendering

## Summary
We store each roadmap as a semantic YAML tree in `catalog/roadmaps/<category-id>.yaml` (nodes with parent, order, optional course link, and an example course description, plus optional cross-links) and render it as an interactive mind map with `@xyflow/react` and `elkjs` automatic layout. A semantic format without coordinates is easy for the roadmap agent to generate and validate, and automatic layout keeps the rendered graph readable however many nodes are added.

## Context
- When a course creates a new main topic, a roadmap for that topic is generated with premade subtopics, including the new course.
- In the rendered roadmap, a node with a course links to it; a node without a course opens a modal with an example description the user can paste into a new course template.
- The roadmap agent writes roadmaps; schema validation must catch broken references.
- Options for the format:
  - A: semantic YAML or JSON tree, layout computed at render time.
  - B: Obsidian JSON Canvas (`.canvas`), which stores absolute coordinates and also renders in Obsidian.
  - C: Mermaid `mindmap` text.
- Options for rendering: React Flow (`@xyflow/react`) with `elkjs`, Cytoscape.js, D3, or Mermaid.

## Decision
- Format A. Schema (`src/content/schema/roadmap.ts`):
  ```yaml
  id: backend                 # equals taxonomy category id
  title: Backend
  description: ...
  nodes:
    - id: http-fundamentals   # unique kebab-case
      title: HTTP fundamentals
      parent: null            # root has null; every other node has a parent id
      order: 1                # sibling order
      kind: topic             # topic | subtopic
      summary: One sentence.
      course: null            # course slug when a course exists
      example:                # required when course is null
        title: HTTP fundamentals
        topic: HTTP fundamentals
        description: Pasteable course description, 3-6 sentences.
        suggested_labels: [http]
  related:                    # optional non-tree edges
    - { from: http-fundamentals, to: rest-apis }
  ```
- Rendering: `@xyflow/react` with `elkjs` (`mrtree` algorithm) layout computed on the client, nodes styled with theme tokens; read-only (no dragging or editing).
- Exactly one root node; no cycles via `parent`; `course` must reference an existing course folder.

## Alternatives considered
- B (JSON Canvas): Obsidian preview for free, but the agent would have to compute coordinates, and edits break layout.
- C (Mermaid mindmap): cannot attach course links or modal data per node.
- Cytoscape.js or D3: workable, but React Flow gives React-component nodes, which the modal and theme integration need, and it is already used by the kit (see [ADR-0006](0006-kit-rendering-libraries.md)).

## Consequences
- Roadmaps are not visual in Obsidian; a generated `.canvas` export could be added later in its own spec.
- Client-side layout costs a little time on large roadmaps; acceptable for tens of nodes.
