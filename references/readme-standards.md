# README Standards

Use these rules when deciding how much user-facing documentation should live in `README.md` and when a repository should shift durable docs into a VitePress docs site.

- Pair this reference with [coding-stack-preferences.md](./coding-stack-preferences.md) for default docs-stack choices.
- Treat `README.md` as the repository entrypoint, not as a dumping ground for every possible detail.

## Goals

- Make the first screen answer what the project is, who it is for, how to start, and where to go next.
- Keep `README.md` as the repository entrypoint rather than an unstructured manual.
- Choose one intentional README mode: full README, GitHub Action README, or docs wrapper.
- When a fuller docs site is needed, prefer VitePress unless the repository already has another approved docs stack.

## Universal README Rules

- Lead with the project name and a one- or two-sentence description before support, changelog, or contributor sections.
- Put the primary install or usage path above deeper reference material.
- If the repo is primarily consumed through one primary install or execution path, put that quickstart above local development or build steps.
- Keep section titles concrete and user-facing.
- Keep examples runnable and close to the surface they explain.
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

- The repository needs multiple durable guides or tutorials.
- The audience splits across different user journeys such as install, operate, configure, extend, or contribute.
- Reference material is large enough that it wants separate pages.
- The README would need repeated cross-linking, long subsections, or many top-level sections to stay complete.
- The repo already has or should have a VitePress docs site.

## Escalation Rules

- Prefer a README for repository-level orientation, install or setup instructions, common usage, and concise reference.
- Prefer inline code or API docs for contracts, non-obvious side effects, error behavior, and details that must stay close to code.
- Escalate to fuller docs only when the README becomes overloaded or the repo clearly needs multiple durable pages.
- Do not split content into a docs site for polish alone when a focused README still serves the task cleanly.
- When a docs site is justified, keep the README as a strong entrypoint with a quickstart plus key docs-site links instead of duplicating the full reference surface.
- For GitHub Action repositories, keep the action contract in `README.md` even when deeper docs exist elsewhere because the README is the Marketplace and repository entrypoint users see first.
