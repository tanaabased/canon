<p align="center">
  <img src="./assets/canon-book.png" alt="Tanaab Canon" width="360" />
</p>

<h1 align="center">Tanaab Canon</h1>

<p align="center">
  Shared Tanaab operating guidance, with a Codex plugin for planning work, authoring code, and preparing releases.
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

Have `git` available for repository work, Bun for bundled scripts, and an authenticated `gh` CLI for GitHub operations.

Install from the [GitHub releases page](https://github.com/tanaabased/canon/releases):

1. Download the release archive for the version you want.
2. Extract it into `~/.codex/plugins/tanaab`.
3. Create or update `~/.agents/plugins/marketplace.json` so it points at that plugin directory.
4. Restart the ChatGPT desktop app, open Plugins, and install `Tanaab Maneuvering Systems` from your personal marketplace.
5. Start a new Codex task so the installed skills are available.

Example personal marketplace entry:

```json
{
  "name": "personal",
  "interface": {
    "displayName": "Personal Plugins"
  },
  "plugins": [
    {
      "name": "tanaab",
      "source": {
        "source": "local",
        "path": "./.codex/plugins/tanaab"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

- If `~/.agents/plugins/marketplace.json` already exists, add the `tanaab` plugin entry instead of replacing the whole file.
- Codex resolves `source.path` relative to the marketplace root, so the `./.codex/plugins/tanaab` path is the important part.
- For the underlying plugin and marketplace rules, see the official OpenAI docs for [using plugins](https://learn.chatgpt.com/docs/plugins) and [packaging plugins and local marketplaces](https://developers.openai.com/plugins/build/plugins).

## Skills

In a Codex task opened in your project, invoke a skill by name. For a read-only first pass:

```text
Use $tanaab-project-optimizer to audit this project's documentation and propose
only changes worth making. Keep the audit read-only.
```

The [plugin manifest](./.codex-plugin/plugin.json) bundles all 22 skills below.

### Project and task management

| Skill                                                                       | Owns                                                                         |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`tanaab-github-issue-form-author`](./skills/github-issue-form-author/)     | Task, Bug, and Feature issue forms and intake extraction.                    |
| [`tanaab-github-issue-schema-author`](./skills/github-issue-schema-author/) | Organization issue fields and repository labels.                             |
| [`tanaab-project-author`](./skills/project-author/)                         | GitHub repository creation and managed settings.                             |
| [`tanaab-project-milestone-author`](./skills/project-milestone-author/)     | Milestone state, due dates, and verified task membership.                    |
| [`tanaab-project-milestone-planner`](./skills/project-milestone-planner/)   | Milestone coverage, task selection, and owner handoffs.                      |
| [`tanaab-project-optimizer`](./skills/project-optimizer/)                   | Read-only project audits and staged improvement plans.                       |
| [`tanaab-task-author`](./skills/task-author/)                               | Compact Task, Bug, and Feature drafting, publication, and normalization.     |
| [`tanaab-task-completion-check`](./skills/task-completion-check/)           | Read-only task completion assessment against criteria and delivery evidence. |
| [`tanaab-task-decomposer`](./skills/task-decomposer/)                       | Task splitting, milestone reframing, and verified child-task publication.    |

### Code and interface authoring

| Skill                                                                           | Owns                                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`tanaab-javascript-author`](./skills/javascript-author/)                       | JavaScript, TypeScript, and Bun implementation.                                 |
| [`tanaab-javascript-cli-author`](./skills/javascript-cli-author/)               | JavaScript and TypeScript Bun CLI entrypoints, help, versioning, and packaging. |
| [`tanaab-javascript-repo-standardizer`](./skills/javascript-repo-standardizer/) | JavaScript, TypeScript, and Bun repository baselines.                           |
| [`tanaab-openclaw-plugin-author`](./skills/openclaw-plugin-author/)             | Native OpenClaw plugin authoring and delivery.                                  |
| [`tanaab-shell-cli-author`](./skills/shell-cli-author/)                         | Bash and PowerShell CLI entrypoints, wrappers, help, logging, and safety.       |
| [`tanaab-vitepress-author`](./skills/vitepress-author/)                         | VitePress documentation and static-site surfaces.                               |
| [`tanaab-vue-author`](./skills/vue-author/)                                     | Vue 3 components and Composition API implementation.                            |

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
| [`tanaab-readme-author`](./skills/readme-author/)       | Repository README structure and content.             |
| [`tanaab-skill-author`](./skills/skill-author/)         | Skill scaffolding, validation, and portfolio review. |

## Development

For local development, symlink a checkout into your Codex plugin directory:

```sh
git clone git@github.com:tanaabased/canon.git
cd canon
bun install

mkdir -p ~/.codex/plugins
ln -sfn "$PWD" ~/.codex/plugins/tanaab
```

- After the symlink is in place, add the same `tanaab` entry shown above to `~/.agents/plugins/marketplace.json`, then install the plugin from the Codex UI.
- For managed plugin or `codexsync` changes, run `bun run test`, `bun run lint`, `bun run codex:validate`, and `bun run codex:check`; if cache drift is reported, run `bun run codex:sync` and then `bun run codex:check` again.
- For targeted day-to-day validation, run the narrowest check that matches the surface you changed, such as:

```sh
bun skills/skill-author/scripts/validate-skill.js --skill-dir skills/javascript-author
```

See [AGENTS.md](./AGENTS.md#canon-design) for directory ownership and the [architecture guide](./guidance/skills-agents-canon-model.md) for context loading and packaging.

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
