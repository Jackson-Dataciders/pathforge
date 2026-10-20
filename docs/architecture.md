# Architecture

Binding summary of accepted architecture decisions. Each entry links to its ADR, which holds the details.

## Stack and repository
- Single Next.js App Router app in strict TypeScript at the repository root, Tailwind CSS v4, npm, Node 22, Vitest and Playwright, content pages statically generated from the repository and hosted on Vercel. See [ADR-0001](adr/0001-frontend-stack-and-tooling.md).
- Layout: app code in `src/`, content vault in `courses/`, taxonomy and roadmaps in `catalog/`, prebuilt themes in `themes/`, pipeline CLI, schemas, and fixtures in `pipeline/` (course agents in `.github/agents/course-*.agent.md`, see Course pipeline), all paths defined in `src/content/paths.ts`. See [ADR-0002](adr/0002-content-repository-layout.md).

## Content
- Lessons are the vault `.md` files, rendered directly; kit components are fenced `kit:<name>` YAML blocks and diagrams are `mermaid` blocks, compiled with `@mdx-js/mdx` in Markdown mode. See [ADR-0003](adr/0003-lesson-storage-and-authoring-format.md).
- Course README `status` is managed by the pipeline (`draft` → `planning` → `researching` → `implementing` → `validating` → `published` | `failed`); a `draft` README with all required fields filled is ready; each lesson carries exactly one lifecycle tag (`created`, `planned`, `implemented`) shown by a per-course `board.base`. See [ADR-0004](adr/0004-course-and-lesson-lifecycle-states.md).
- Lesson claims and sources live in lesson frontmatter, text cites them with `[^cN]` footnotes, and validation combines a structural citation check with an LLM claim audit. See [ADR-0008](adr/0008-source-traceability-model.md).
- Roadmaps are semantic YAML trees in `catalog/roadmaps/<category-id>.yaml`, rendered with `@xyflow/react` and `elkjs`. See [ADR-0012](adr/0012-roadmap-data-format-and-rendering.md).

## Component kit
- Every lesson component has a zod schema and registry entry; a generated `src/kit/manifest.json` describes the kit to agents; new components only when declared in the course plan, enforced by a path guard. See [ADR-0005](adr/0005-component-kit-contract-and-extension-policy.md).
- Libraries: Mermaid, Motion, CodeMirror 6, `@xyflow/react` with `elkjs`, plain SVG, `expr-eval`. See [ADR-0006](adr/0006-kit-rendering-libraries.md).
- Code challenges: JavaScript, TypeScript, and Python run in the browser (Web Worker, Pyodide); C++, Rust, and C# run via the `/api/run` proxy to Compiler Explorer; validation uses the same harnesses on local toolchains (always in CI; on the user's machine with a Compiler Explorer fallback). See [ADR-0007](adr/0007-code-challenge-verification.md).

## UI
- Semantic CSS-variable tokens with Tailwind, `next-themes` for light/dark/system, and a fixed set of prebuilt color themes chosen per device. See [ADR-0009](adr/0009-theme-system.md).

## Accounts and progress
- GitHub OAuth via Auth.js for identity only, a single allowed GitHub user id, and a server-side fine-grained token for repository writes; content is public. See [ADR-0010](adr/0010-github-authentication-and-write-access.md).
- Progress is one `progress.json` on the orphan `progress` branch, written through the GitHub Contents API with merge-and-retry; signed out, progress is kept in the browser and merged on sign-in; Vercel ignores the branch. See [ADR-0011](adr/0011-progress-storage-on-progress-branch.md).

## Course pipeline
- Course agents are VS Code Copilot custom agents in `.github/agents/course-*.agent.md`, billed to the signed-in user's Copilot credits: `course-planner` (GPT-5.6 Luna, user-started with the README attached) hands off once to `course-builder` (GPT-5.6 Terra), which runs `course-roadmap`, `course-researcher`, `course-implementer` (Luna) and `course-auditor` (Terra) as subagents; `.vscode/settings.json` auto-approves the needed commands and fetches. This replaces the `pipeline/agents/` location from ADR-0002; `pipeline/` keeps the deterministic CLI, schemas, and fixtures. See [ADR-0016](adr/0016-course-agents-in-vs-code.md), which supersedes [ADR-0015](adr/0015-course-agent-runtime-copilot-cli.md) and, through it, [ADR-0013](adr/0013-course-agent-runtime.md).
- Courses are built locally: `pipeline start` creates `course/<slug>` from the current branch; each stage is followed by its gate and a commit; failing stages are retried once; validation runs before `pipeline publish` merges into the base branch and pushes; failures set `status: failed` on the base branch. Pushing a README starts nothing. CI checks on `main` and Vercel's build act as safety nets; `main` stays unprotected. See [ADR-0017](adr/0017-local-course-build-flow.md), which supersedes [ADR-0014](adr/0014-course-pipeline-orchestration.md).
