<p align="center">
  <img src="./assets/canon-book.png" alt="Tanaab Canon" width="360" />
</p>

<h1 align="center">Tanaab Canon</h1>

<p align="center">
  Shared Tanaab operating guidance, with Codex and OpenClaw plugins for planning work, authoring code, and preparing releases.
</p>

<p align="center">
  <a href="https://github.com/tanaabased/canon/releases/latest"><img src="https://img.shields.io/github/v/release/tanaabased/canon" alt="Latest release" /></a>
  <a href="https://github.com/tanaabased/canon/actions/workflows/pr-linter.yml"><img src="https://github.com/tanaabased/canon/actions/workflows/pr-linter.yml/badge.svg" alt="Lint" /></a>
  <a href="https://github.com/tanaabased/canon/actions/workflows/pr-unit-tests.yml"><img src="https://github.com/tanaabased/canon/actions/workflows/pr-unit-tests.yml/badge.svg" alt="Unit tests" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/tanaabased/canon" alt="MIT license" /></a>
</p>

## Overview

- Draft compact GitHub issues using the authoring agent's voice skill when available.
- Plan milestones and assess task completion against project evidence.
- Apply shared standards to code, documentation, and releases.
- Audit projects for useful improvements, with permission to leave well enough alone.

## Installation

Have Bun available for bundled scripts, and `git` plus an authenticated `gh` CLI for repository work. See [installation](./INSTALLATION.md) for prerequisites, upgrades, local checkouts, and optional OpenClaw guidance.

> npm and ClawHub distribution start with the next release; use a local checkout until then.

For Codex, install Node/npm and the supported Codex CLI listed in the [prerequisites](./INSTALLATION.md#codex), then run:

```sh
npx --yes --package=@tanaab/codex-tools@1 -- codex-tools install npm:@tanaab/canon
```

For OpenClaw 2026.9.5 or newer:

```sh
openclaw plugins install clawhub:@tanaab/canon --accept-capabilities
```

## Skills

In a Codex project task or OpenClaw chat, invoke a skill by name. For a read-only first pass:

```text
Use $tanaab-project-optimizer to audit this project's documentation and propose
only changes worth making. Keep the audit read-only.
```

The [Codex](./.codex-plugin/plugin.json) and [OpenClaw](./openclaw.plugin.json) manifests expose all 23 skills below.

### Project and task management

| Skill                                                                       | Owns                                                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`tanaab-github-issue-form-author`](./skills/github-issue-form-author/)     | Task, Bug, and Feature issue forms and intake extraction.                    |
| [`tanaab-github-issue-schema-author`](./skills/github-issue-schema-author/) | Organization issue fields and repository labels.                             |
| [`tanaab-project-author`](./skills/project-author/)                         | GitHub repository creation, settings, descriptions, and topics.              |
| [`tanaab-project-milestone-author`](./skills/project-milestone-author/)     | Milestone state, due dates, and verified task membership.                    |
| [`tanaab-project-milestone-planner`](./skills/project-milestone-planner/)   | Milestone coverage, task selection, and owner handoffs.                      |
| [`tanaab-project-optimizer`](./skills/project-optimizer/)                   | Read-only project audits and staged improvement plans.                       |
| [`tanaab-task-author`](./skills/task-author/)                               | Compact Task, Bug, and Feature drafting, publication, and normalization.     |
| [`tanaab-task-completion-check`](./skills/task-completion-check/)           | Read-only task completion assessment against criteria and delivery evidence. |
| [`tanaab-task-decomposer`](./skills/task-decomposer/)                       | Task splitting, milestone reframing, and verified child-task publication.    |

### Code and interface authoring

| Skill                                                                           | Owns                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`tanaab-codex-plugin-author`](./skills/codex-plugin-author/)                   | Codex plugin packaging, validation, npm delivery, and archive migration.  |
| [`tanaab-javascript-author`](./skills/javascript-author/)                       | JavaScript, TypeScript, and Bun implementation.                           |
| [`tanaab-javascript-cli-author`](./skills/javascript-cli-author/)               | JavaScript and TypeScript CLI source, distribution, help, and versioning. |
| [`tanaab-javascript-repo-standardizer`](./skills/javascript-repo-standardizer/) | JavaScript, TypeScript, and Bun repository baselines.                     |
| [`tanaab-openclaw-plugin-author`](./skills/openclaw-plugin-author/)             | Native OpenClaw plugin authoring and delivery.                            |
| [`tanaab-shell-cli-author`](./skills/shell-cli-author/)                         | Bash and PowerShell CLI entrypoints, wrappers, help, logging, and safety. |
| [`tanaab-vitepress-author`](./skills/vitepress-author/)                         | VitePress documentation and static-site surfaces.                         |
| [`tanaab-vue-author`](./skills/vue-author/)                                     | Vue 3 components and Composition API implementation.                      |

### GitHub and delivery

| Skill                                                               | Owns                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`tanaab-github-action-author`](./skills/github-action-author/)     | GitHub Action metadata, runtime artifacts, and documentation.       |
| [`tanaab-github-workflow-author`](./skills/github-workflow-author/) | GitHub Actions triggers, permissions, jobs, and reusable workflows. |
| [`tanaab-release-author`](./skills/release-author/)                 | Changelog-backed GitHub Release drafts and readiness checks.        |

### Documentation and meta

| Skill                                                   | Owns                                                 |
| ------------------------------------------------------- | ---------------------------------------------------- |
| [`tanaab-changelog-author`](./skills/changelog-author/) | `CHANGELOG.md` authoring and maintenance.            |
| [`tanaab-readme-author`](./skills/readme-author/)       | Repository READMEs and companion guides.             |
| [`tanaab-skill-author`](./skills/skill-author/)         | Skill scaffolding, validation, and portfolio review. |

## Development

See [Development](./DEVELOPMENT.md) for setup, unit and example tests, package checks, cache maintenance, and release preparation.

## Issues, Questions and Support

- Open a task as a GitHub issue in [tanaabased/canon](https://github.com/tanaabased/canon) when the project has canon drift, broken skill behavior, stale references, or missing guidance.
- Route implementation work to the owning project or skill surface instead of overloading this repository with unrelated product fixes.

## Changelog

- See [CHANGELOG.md](./CHANGELOG.md) for release history.
- See the [GitHub releases page](https://github.com/tanaabased/canon/releases) for published release notes.

## License

- [MIT](./LICENSE)

## Contributors

<a href="https://github.com/tanaabased/canon/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tanaabased/canon" />
</a>

Made with [contrib.rocks](https://contrib.rocks).
