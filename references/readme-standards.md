# README Standards

Use these rules when deciding how much user-facing documentation should live in `README.md`, when a repository should add root-level companion guides, and when those guides should graduate into a VitePress docs site.

- Pair this reference with [coding-stack-preferences.md](./coding-stack-preferences.md) for default docs-stack choices.
- Treat `README.md` as the repository entrypoint, not as a dumping ground for every possible detail.
- Treat the line-count and guide-count thresholds below as authoring guidance and manual review prompts, not mechanical validation errors.

## Goals

- Make the first screen answer what the project is, who it is for, how to start, and where to go next.
- Keep `README.md` as the repository entrypoint rather than an unstructured manual.
- Choose one intentional README mode: full README, companion guides, GitHub Action README, or docs wrapper.
- When a fuller docs site is needed, prefer VitePress unless the repository already has another approved docs stack.

## Universal README Rules

- Strongly prefer a polished first screen with the project name, a centered project visual, a short centered row of meaningful badges, and a one- or two-sentence description.
- Use a roughly 180-pixel-wide image as the default starting point. Prefer `<picture>` when real dark and light assets exist.
- Keep badges limited to truthful, useful signals such as the latest release, build or deploy state, supported platform or runtime, and product classification.
- Treat missing visual assets as an improvement opportunity, not a blocker. Do not fabricate decorative images, statuses, or compatibility claims.
- Put critical compatibility, support, or safety notes immediately after the description when readers need them before starting.
- Use the README for the common path and the needs of roughly 80 percent of readers. Move less-common, higher-context material into a companion guide.
- Put the primary install or usage path above deeper reference material.
- If the repo has one truthful primary install or execution path, put that quickstart above local development or build steps. Do not invent a quickstart for a repository without a supported first-run path.
- Keep section titles concrete and user-facing.
- Keep examples runnable and close to the surface they explain.
- Keep common options, inputs, and configuration in the README even when the complete reference lives elsewhere.
- Keep development guidance concise and distinguish safe local commands from CI-owned, generated, privileged, or machine-mutating workflows.
- Do not mirror an entire docs-site sidebar into the README. Link only the key destinations readers actually need.
- Avoid empty sections, placeholder headings with no guidance, or generic link farms without context.
- Put support, changelog, maintainers, contributors, license, or policy links near the end unless the repository is itself a support or policy surface.
- When a README includes a `Contributors` section, use the standard `contrib.rocks` embed with the real repo slug instead of prose placeholders or manual contributor lists.

## README Modes

### Full README

Use the full README mode when the repository can realistically keep all durable user-facing documentation in one file without forcing readers to hunt through a long manual.

Use it when most of these are true:

- The repo has one primary audience or one narrow secondary audience.
- The main install or setup path is short.
- The common usage path fits in one README with a few examples.
- Configuration, environment variables, or command reference stay concise.
- The repo does not need multiple durable guides, recipes, or separate reference pages.
- A complete README would still feel readable as one document.

Typical fit:

- internal tooling repos
- bootstrap or automation repos
- hosted bootstrap or raw-install repos
- small CLIs
- libraries with a narrow API surface

### Companion Guides README

Use the companion guides mode when `README.md` can still serve as a strong primary entrypoint, but one or two linear, repository-scoped guides keep long-tail material from overwhelming the common path.

Use `ADVANCED.md` when the extracted material spans several less-common or higher-context subjects. Strong extraction signals include:

- complete CLI option, environment-variable, configuration-schema, or precedence references
- installed-component inventories and platform-, host-, or environment-specific behavior
- preflight, security, recovery, and operator procedures
- detailed verification fields, health contracts, log interpretation, and troubleshooting
- alternate execution modes, rare integrations, payload resolution, migrations, and upgrade internals

Keep the common configuration and the most useful examples in `README.md`. A long reference is not automatically advanced when most users need it to succeed.

Use a topical guide when one substantial subject has its own audience or workflow:

| Guide                | Appropriate content                                                        |
| -------------------- | -------------------------------------------------------------------------- |
| `CONFIGURATION.md`   | Full configuration schema, precedence, environment variables, and examples |
| `CODEX.md`           | Optional Codex plugin installation, workflows, prompts, and alignment      |
| `OPENCLAW.md`        | OpenClaw setup, runtime integration, workspace behavior, and operations    |
| `OPERATIONS.md`      | Deployment, monitoring, backups, health checks, and recovery               |
| `TROUBLESHOOTING.md` | Diagnostic flows and recurring failure remediation                         |
| `UPGRADING.md`       | Version transitions, compatibility changes, and migrations                 |
| `CONTRIBUTING.md`    | Contributor workflow that exceeds concise README development guidance      |

These names are examples, not a required catalog. Add a guide only when real content justifies it, and choose a stable name that describes its owned subject.

Every companion guide should:

- state its purpose and audience immediately
- link back to the primary README
- avoid repeating the primary install or usage path
- cross-link another guide only when the relationship helps readers complete a task
- be linked contextually from the relevant README section instead of appearing only in a generic link list

Treat README length as a review signal rather than a limit:

- Around 250 source lines, review whether long-tail content wants a companion guide.
- Around 400 source lines, prefer extraction unless the length is intrinsic to the primary contract, such as a GitHub Action's inputs and examples.
- Never pad, truncate, or split documentation only to satisfy a line count.

### GitHub Action README

Use the GitHub Action README mode when the repository's primary product is a GitHub Action that users consume through `uses:` or GitHub Marketplace.

Use it when most of these are true:

- The repo's main contract is defined by `action.yml`.
- Users need inputs, outputs, caveats, permissions, and usage examples directly in `README.md`.
- The action may have deeper guides later, but the Marketplace-facing README still needs to stand on its own.
- The action is a composite action or a JavaScript-backed action whose built runtime is committed to the repo.

### Docs Wrapper README

Use the docs wrapper mode when the repo still needs a strong README entrypoint, but durable docs should live in a VitePress docs site.

Use it when any of these are true:

- The repository needs a navigable set of durable guides or tutorials.
- The audience splits across different user journeys such as install, operate, configure, extend, or contribute.
- Reference material is large enough that it wants separate pages.
- The README would need repeated cross-linking, long subsections, or many top-level sections to stay complete.
- The repo already has or should have a VitePress docs site.

## Escalation Rules

- Prefer a README for repository-level orientation, install or setup instructions, common usage, and concise reference.
- Prefer inline code or API docs for contracts, non-obvious side effects, error behavior, and details that must stay close to code.
- Add companion guides before a docs site when one or two linear root-level references keep the repository documentation coherent.
- Require an explicit VitePress review when the repository reaches `README.md`, `ADVANCED.md`, and three or more topical guides.
- Recommend VitePress earlier when readers need navigation, search, versioning, a public documentation URL, or several independent audience journeys.
- Treat repeated cross-linking, duplicated explanations, and readers needing to guess which file owns an answer as docs-site signals.
- Do not split content into a docs site for polish alone when a focused README still serves the task cleanly.
- When a docs site is justified, keep the README as a strong entrypoint with its real primary path plus key docs-site links instead of duplicating the full reference surface.
- For GitHub Action repositories, keep the action contract in `README.md` even when deeper docs exist elsewhere because the README is the Marketplace and repository entrypoint users see first.
