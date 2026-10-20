---
name: pull-request
description: Prepare a branch and pull request draft, request button-based approval before publishing, then wait for approval before creating the PR.
argument-hint: Optional spec file path; otherwise use the current changes
agent: agent
tools: [execute/getTerminalOutput, execute/runInTerminal, read/terminalLastCommand, read/terminalSelection, search, vscode/askQuestions, read/readFile]
---
Prepare a pull request using the optional spec file `${input:specFile}`. If no spec file was provided, use the current changes as the source of truth.

1. Run `git status` and inspect both `git diff` and `git diff --cached`. If the working tree has no changes, stop and report that there is nothing to publish. Include untracked files in the review when relevant; do not include unrelated changes.
2. Detect the hosting provider with `git remote get-url origin`. Continue only for `github.com` (GitHub) or `dev.azure.com` / `visualstudio.com` (Azure DevOps). If the remote is missing or uses another host, stop and explain why.
3. Determine the target branch. If the current branch is `main` or `master`, propose a branch named `feature/NNN-kebab-title` based on the spec filename when a spec is supplied. If no spec is supplied, propose `feature/<short-kebab-title>` based on the changes. Ensure the name is unused, but do not create or switch branches yet. Do not change branches otherwise.
4. If a supplied or changed spec has a non-empty `work_item` URL, derive its reference from the URL: `github.com/.../issues/<id>` becomes `#<id>`; `dev.azure.com/.../_workitems/edit/<id>` becomes `AB#<id>` for GitHub and `#<id>` for Azure DevOps. If `work_item` is empty or absent, use no reference. Do not guess a reference from prose.
5. Review the changes and prepare a concise imperative commit message. Append the derived reference when present. Do not commit unrelated files or amend existing commits.
6. Draft the PR title and body. The body must include a concise summary of the changes, a link to the spec when one exists, and the spec's acceptance criteria with checkboxes reflecting only criteria supported by the changes or verification evidence. Include `Closes <reference>` when a reference exists. Do not claim criteria are complete without evidence.
7. Present the proposed branch, commit message, PR title, and complete body. Then call `#tool:vscode_askQuestions` with one required, single-choice question and exactly these options: `Allow commit and push` and `Block`. Do not allow freeform input. Proceed only when the user selects `Allow commit and push`. If the user blocks, cancels, gives no answer, or the tool is unavailable, do not create/switch branches, commit, or push; report that publication was blocked. This approval covers branch creation/switching, the commit, and push only; it does not authorize PR creation.
8. After approval, create/switch to the proposed branch if needed, commit only the reviewed changes, and push to `origin`. If any operation fails, stop before the next irreversible step and report the failure and current branch/status.
9. After pushing, present the branch, title, and complete body as a draft, then stop and wait for the user's separate explicit confirmation before creating the PR.
10. After that confirmation, create the PR using the GitHub pull request tools for GitHub, or `az repos pr create --source-branch <branch> --title <title> --description <body>` for Azure DevOps. Add `--work-items <id>` for an Azure DevOps work item. Never merge the PR.

If any required operation fails, stop before proceeding to the next irreversible step and report the failure and current branch/status. Never discard or overwrite user changes.