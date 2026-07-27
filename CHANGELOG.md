## {{ UNRELEASED_VERSION }} - [{{ UNRELEASED_DATE }}]({{ UNRELEASED_LINK }})

## v0.5.0 - [July 27, 2026](https://github.com/tanaabased/canon/releases/tag/v0.5.0)

### Breaking Changes

- Changed `bun run lint` to enforce ESLint and Prettier; Canon validation remains available through `bun run codex:validate`. [#7](https://github.com/tanaabased/canon/pull/7)
- Renamed `tanaab-github-release-author` to `tanaab-release-author` without a compatibility alias. [#7](https://github.com/tanaabased/canon/pull/7)
- Replaced `tanaab-github-checks-triage` with the task-first `tanaab-task-completion-check`. [#7](https://github.com/tanaabased/canon/pull/7)
- Required `metadata.openclaw` and `--openclaw-emoji` for Canon skill scaffolding and validation. [#7](https://github.com/tanaabased/canon/pull/7)

### New Features

- Added `Optimization` facets to applicable skills and type-shaped Skill Author scaffolds. [#7](https://github.com/tanaabased/canon/pull/7)
- Added README companion-guide templates for advanced, topical, and docs-wrapper content. [#7](https://github.com/tanaabased/canon/pull/7)
- Added `tanaab-project-author` for GitHub-backed project creation, policy inspection, and confirmed settings synchronization. [#7](https://github.com/tanaabased/canon/pull/7)
- Added `tanaab-project-optimizer` for read-only cross-surface audits, staged plans, and convergence decisions. [#7](https://github.com/tanaabased/canon/pull/7)
- Added `tanaab-task-completion-check` for issue criteria, linked pull requests, reviews, checks, and failure evidence. [#7](https://github.com/tanaabased/canon/pull/7)

### Policy and Guidance

- Added conditional TypeScript and Bun workspace monorepo baselines without making `src/` the default. [#7](https://github.com/tanaabased/canon/pull/7)
- Adopted ESLint and standalone Prettier as the required JavaScript and TypeScript lint and format baseline. [#7](https://github.com/tanaabased/canon/pull/7)
- Clarified CLI and Leia conventions for environment variables, literal matching, lowercase test prose, safe negative tests, and example support.
- Defined GitHub-backed mappings for projects, tasks, milestones, changes, validation, and releases. [#7](https://github.com/tanaabased/canon/pull/7)
- Expanded README policy with an 80/20 content split, companion-guide signals, visual entrypoints, and a docs-site threshold. [#7](https://github.com/tanaabased/canon/pull/7)
- Standardized JavaScript and TypeScript scopes around `bin`, `scripts`, `lib`, `utils`, and flat owner-local tests. [#7](https://github.com/tanaabased/canon/pull/7)
- Standardized optimization operations, portfolio review, dependency ordering, and a no-churn convergence gate. [#7](https://github.com/tanaabased/canon/pull/7)
- Updated CI policy to separate independent gates, prefer Ubuntu and macOS, and require explicit versioned Windows coverage. [#7](https://github.com/tanaabased/canon/pull/7)

### Improvements

- Expanded focused tests for project policy, task completion, skill validation, CLI templates, and Vue code generation. [#7](https://github.com/tanaabased/canon/pull/7)
- Pinned Canon to Bun `1.3.14` across local and CI metadata. [#7](https://github.com/tanaabased/canon/pull/7)
- Refreshed canonical workflows and examples to use `actions/checkout@v7`. [#6](https://github.com/tanaabased/canon/pull/6) [#7](https://github.com/tanaabased/canon/pull/7)
- Reorganized Canon JavaScript into thin entrypoints, orchestration libraries, one-function utilities, and flat tests. [#7](https://github.com/tanaabased/canon/pull/7)
- Separated pull-request lint and unit-test checks into independent workflows and status identities. [#7](https://github.com/tanaabased/canon/pull/7)
- Updated plugin discovery, prompts, and metadata for TypeScript, project management, optimization, and OpenClaw. [#7](https://github.com/tanaabased/canon/pull/7)
- Updated the root README with visual identity, truthful status badges, and release-archive installation guidance. [#7](https://github.com/tanaabased/canon/pull/7)

### Bug Fixes

- Fixed generated skill default-prompt grammar. [#7](https://github.com/tanaabased/canon/pull/7)
- Fixed PowerShell template argument handling and cross-platform smoke startup. [#7](https://github.com/tanaabased/canon/pull/7)
- Fixed release stamping so package, plugin, CLI, and tag versions share one resolved value. [#7](https://github.com/tanaabased/canon/pull/7)
- Fixed release workflow version expansion and terminal setup. [#7](https://github.com/tanaabased/canon/pull/7)
- Fixed `tanaab-release-author` to target the default branch and verify existing tags before reuse. [#7](https://github.com/tanaabased/canon/pull/7)

## v0.4.0 - [May 1, 2026](https://github.com/tanaabased/canon/releases/tag/v0.4.0)

### Canon

- Added `ideas/branding-accessibility-skill.md` for future visual accessibility ownership.
- Added `references/vitepress-markdown-pages.md` for VitePress Markdown page UI, global component reuse, and page reachability.
- Documented high-value helper contracts across canon sync, CLI support, utility, and skill-author scripts.
- Updated coding skill standards to require `## Documentation` lifecycle sections.
- Updated `references/inline-code-and-api-docs.md` to prefer useful JSDoc tags for exported helpers.

### Skills

- Added component-level accessibility guidance to `tanaab-vue-author`.
- Added playground-first Vue component documentation fallbacks with schema-driven generated usage code.
- Updated current coding skills with dedicated `## Documentation` sections.
- Updated JavaScript and CLI authoring guidance for API docs, help surfaces, and documentation routing.
- Updated Vue and VitePress guidance for component docs, Markdown pages, and reusable frontend boundaries.

## v0.3.1 - [April 26, 2026](https://github.com/tanaabased/canon/releases/tag/v0.3.1)

- Added release archive checks that reinstall production dependencies before packaging canon bundles.

## v0.3.0 - [April 26, 2026](https://github.com/tanaabased/canon/releases/tag/v0.3.0)

### Canon

- Added `codexsync` for validating and syncing managed plugin cache state.
- Added PR unit-test workflow coverage for canon validation on Ubuntu and macOS.
- Fixed release version stamping for `.codex-plugin/plugin.json`.
- Updated CLI standards for version help text, dimmed usage placeholders, and release-stampable script versions.
- Updated JavaScript repo canon for Bun-first validation helpers and canon script structure.
- Updated Leia scenario guidance for release-shaped CLI examples and focused assertions.

### Skills

- Added `tanaab-github-release-author` for release readiness, version selection, changelog-backed release notes, and GitHub Release drafts.
- Updated `tanaab-javascript-author` for Codex 5.5 readiness and focused JavaScript test guidance.
- Updated `tanaab-javascript-cli-author` and `tanaab-shell-cli-author` templates for aligned version help text.
- Updated `tanaab-vitepress-author` and `tanaab-vue-author` to clarify VitePress and Vue ownership boundaries.

## v0.2.0 - [April 11, 2026](https://github.com/tanaabased/canon/releases/tag/v0.2.0)

### Canon

- Added canonical Markdown buckets for durable guidance, future ideas, stable references, reusable prompts, and shared templates.
- Added a Codex plugin that executes and enforces the live Tanaab canon through installable skills.
- Added a local development flow for plugin symlinks, targeted validation, and day-to-day canon maintenance.
- Added a release-ready install path for versioned archives, personal marketplace setup, and Codex plugin installation.
- Added repo-wide standards for changelog shape, CLI behavior, inline code docs, JavaScript repo structure, and README authoring.

### Skills

- Added `tanaab-changelog-author` for `CHANGELOG.md` drafting, maintenance, and changelog-contract alignment.
- Added `tanaab-github-action-author` for GitHub Action product surfaces such as `action.yml`, committed runtime files, and action README contracts.
- Added `tanaab-github-checks-triage` for GitHub-hosted CI failure investigation and actionable failure summaries.
- Added `tanaab-github-workflow-author` for GitHub Actions workflow graphs, including triggers, permissions, reusable workflows, and job topology.
- Added `tanaab-javascript-author` for JavaScript and Bun implementation work, especially low-coupling helpers and utility logic.
- Added `tanaab-javascript-cli-author` for true Bun CLI product surfaces such as entrypoints, help output, versioning, and packaging contracts.
- Added `tanaab-javascript-repo-standardizer` for JavaScript and Bun repo baselines such as layout, linting, formatting, and baseline scripts.
- Added `tanaab-readme-author` for repository README structure and standardization.
- Added `tanaab-shell-cli-author` for Bash and PowerShell CLI surfaces, including wrappers, help output, and shell safety behavior.
- Added `tanaab-skill-author` for canon skill scaffolding, standardization, and validation.
- Added `tanaab-vitepress-author` for VitePress docs and static-site surfaces.
- Added `tanaab-vue-author` for Vue 3 frontend implementation surfaces such as components and Composition API flows.
