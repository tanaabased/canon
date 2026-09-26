# Documentation Standards

Apply these standards to all documentation: READMEs, supplementary guides such as `ADVANCED.md`, API and CLI references, VitePress or other docs-site pages, generated documentation, and inline comments. The filename, renderer, and owning skill do not change the gate.

## Inventory

Common places to inspect when relevant to the change, including but not limited to:

- `README.md`, including package- and directory-level READMEs
- `ADVANCED.md`
- `DEVELOPMENT.md` and `CONTRIBUTING.md`
- `API.md` and `CLI.md`
- `PLUGINS.md`, `CODEX.md`, and `OPENCLAW.md`
- `CONFIG.md` and `CONFIGURATION.md`
- `OPERATIONS.md`, `TROUBLESHOOTING.md`, and `UPGRADING.md`
- Markdown and MDX pages under `docs/`, `doc/`, `website/`, or the project's configured content directories
- Generated references and their source annotations

Follow existing links and site navigation to find other documentation. This inventory does not require creating missing files or editing every surface inspected.

## Machine Names and Versions

Use backticks for concrete machine names: packages, skills, channels, tools, files, identifiers, CLI commands and flags, and literal versions or version ranges. Name the affected surface explicitly when it helps the reader identify what changed; retain normal prose for human-facing product names. For example: `tanaab-vue-author`, `@tanaab/component-playground`, `edge`, `bun run test`, and `1.2.3`.

## Compatibility and Links

- Link to maintained upstream documentation or the upstream default branch for current guidance. Document minimum compatibility or a supported range only when it affects the reader's choice, such as `1.0.2+`, `^2.0.0`, or `2.x`; a range describes supported compatibility, not necessarily an open-ended minimum. Avoid release-tag and commit-pinned documentation links in ongoing guidance.
- Read current runtime and dependency versions from project declarations rather than repeating them in prose. A current documentation link does not make unreleased features available in the installed package.
- Preserve exact versions in release history, historical evidence, reproducible fixtures, lockfiles, and intentional execution pins. Record the release or commit inspected during an audit in its review report rather than turning that snapshot into a permanent guidance link.

## Documentation Change Gate

Apply this gate before adding, expanding, or relocating documentation on any surface. A code change does not automatically require documentation changes; no documentation change is a valid outcome.

- Identify the reader and the task, decision, or concrete mistake the proposed prose helps them address. Add prose only when that need is unmet.
- Check existing docs, help, schemas, tests, runtime errors, and Actions diagnostics first. Do not add troubleshooting prose for failures that already explain the problem and remedy; document only missing prerequisites, decisions, consequences, or recovery steps readers need.
- Give each explanation one authoritative home. Keep machine contracts in schemas, tests, and runtime instructions; add a human explanation only when the reader needs it to act correctly.
- Prefer correcting, replacing, deleting, or linking existing material over adding sections or files. Use the shortest explanation that closes the gap: a sentence may suffice, and removing unnecessary prose needs no replacement.
- Keep change-specific rationale, one-off debugging history, and validation evidence in the pull request. Promote only reusable guidance that passes this gate into durable docs.
- Preserve useful reference coverage and correct claims made inaccurate by behavior changes. Complete API, CLI, and configuration references can serve a real lookup need; explanatory prose should help readers choose, combine, or understand consequences rather than repeat the inventory.
- Update generated references through their existing source and generator when their contract changes. Regeneration does not require an accompanying narrative, troubleshooting section, or new guide.
- Apply the gate as an internal authoring and review decision, without a mandatory justification template, checklist response, or recurring boilerplate.
