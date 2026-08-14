<p align="center">
  <img src="./assets/canon-book.png" alt="Tanaab Canon" width="360" />
</p>

<h1 align="center">Tanaab Canon</h1>

<p align="center">
  This project is the canonical home for Tanaab engineering, brand, marketing, and other operating guidance, plus the Codex plugin used to execute and enforce the live agent-facing slice of that canon.
</p>

<p align="center">
  <a href="https://github.com/tanaabased/canon/releases/latest"><img src="https://img.shields.io/github/v/release/tanaabased/canon" alt="Latest release" /></a>
  <a href="https://github.com/tanaabased/canon/actions/workflows/pr-linter.yml"><img src="https://github.com/tanaabased/canon/actions/workflows/pr-linter.yml/badge.svg" alt="Lint" /></a>
  <a href="https://github.com/tanaabased/canon/actions/workflows/pr-unit-tests.yml"><img src="https://github.com/tanaabased/canon/actions/workflows/pr-unit-tests.yml/badge.svg" alt="Unit tests" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/tanaabased/canon" alt="MIT license" /></a>
</p>

## Overview

Canon has one live agent-facing surface and a small set of supporting documentation surfaces.

- [`skills/`](./skills/) contains the executable workflows bundled with the Codex plugin.
- [`guidance/`](./guidance/) holds durable policy, architecture, and design-shaping docs that should influence decisions but do not need to trigger as skills.
- [`ideas/`](./ideas/) holds proposals, deferred designs, and revisit notes that are not adopted canon yet.
- [`references/`](./references/) holds stable lookup material such as standards, contracts, naming rules, repo-structure rules, and testing doctrine.
- [`prompts/`](./prompts/) holds reusable prompts with cross-task value, such as project maintenance and optimization workflows.
- [`templates/`](./templates/) holds canonical copy/adapt starters, shared scaffolds, and reusable workflow templates that have proven human or cross-skill value.

## Installation

Versioned release archives are published on the [GitHub releases page](https://github.com/tanaabased/canon/releases). The preferred install path is:

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

Canon is executed and enforced through the Codex plugin rooted at [`.codex-plugin/plugin.json`](./.codex-plugin/plugin.json). The plugin currently bundles the live skills below plus a stub [`.mcp.json`](./.mcp.json) registry reserved for a future shared MCP surface.

### Project and task management

| Skill                                                                       | Owns                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`tanaab-github-issue-form-author`](./skills/github-issue-form-author/)     | Low-friction Task, Bug, and Feature issue forms plus repository alignment.                              |
| [`tanaab-github-issue-schema-author`](./skills/github-issue-schema-author/) | Organization issue fields, field presentation, and canonical repository labels.                         |
| [`tanaab-project-author`](./skills/project-author/)                         | GitHub repository creation and managed settings inspection or synchronization.                          |
| [`tanaab-project-optimizer`](./skills/project-optimizer/)                   | Read-only project audits, convergence reports, and staged improvement plans.                            |
| [`tanaab-task-author`](./skills/task-author/)                               | Canonical Task, Bug, and Feature assessment, creation, revision, normalization, and fallback migration. |
| [`tanaab-task-completion-check`](./skills/task-completion-check/)           | Read-only completion assessment from criteria, linked pull requests, reviews, checks, and failures.     |

### Code and interface authoring

| Skill                                                                           | Owns                                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`tanaab-javascript-author`](./skills/javascript-author/)                       | JavaScript, TypeScript, and Bun implementation.                                 |
| [`tanaab-javascript-cli-author`](./skills/javascript-cli-author/)               | JavaScript and TypeScript Bun CLI entrypoints, help, versioning, and packaging. |
| [`tanaab-javascript-repo-standardizer`](./skills/javascript-repo-standardizer/) | JavaScript, TypeScript, and Bun repository baselines.                           |
| [`tanaab-openclaw-plugin-author`](./skills/openclaw-plugin-author/)             | Native OpenClaw plugin authoring, validation, packaging, and deployment.        |
| [`tanaab-shell-cli-author`](./skills/shell-cli-author/)                         | Bash and PowerShell CLI entrypoints, wrappers, help, logging, and safety.       |
| [`tanaab-vitepress-author`](./skills/vitepress-author/)                         | VitePress documentation and static-site surfaces.                               |
| [`tanaab-vue-author`](./skills/vue-author/)                                     | Vue 3 components and Composition API implementation.                            |

### GitHub and delivery

| Skill                                                               | Owns                                                                                                 |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [`tanaab-github-action-author`](./skills/github-action-author/)     | GitHub Action product surfaces such as `action.yml`, runtime artifacts, and action README contracts. |
| [`tanaab-github-workflow-author`](./skills/github-workflow-author/) | GitHub Actions workflow triggers, permissions, reusable workflows, and job topology.                 |
| [`tanaab-release-author`](./skills/release-author/)                 | Changelog-backed GitHub Release drafts and release-readiness checks.                                 |

### Documentation and meta

| Skill                                                   | Owns                                                                        |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`tanaab-changelog-author`](./skills/changelog-author/) | `CHANGELOG.md` drafting, maintenance, and contract alignment.               |
| [`tanaab-readme-author`](./skills/readme-author/)       | Repository README structure and content.                                    |
| [`tanaab-skill-author`](./skills/skill-author/)         | Canon skill scaffolding, standardization, validation, and portfolio review. |

## Development

For live development, work from a local clone and symlink the repo into your Codex plugin directory.

```sh
git clone git@github.com:tanaabased/canon.git
cd canon
bun install

mkdir -p ~/.codex/plugins
ln -sfn "$PWD" ~/.codex/plugins/tanaab
```

- After the symlink is in place, add the same `tanaab` entry shown above to `~/.agents/plugins/marketplace.json`, then install the plugin from the Codex UI.
- Sync policy for live plugin surfaces is owned by [`AGENTS.md`](./AGENTS.md).
- The repo-local entrypoint for direct cache sync checks is `./bin/codexsync.js`; the public command label remains `codexsync`.
- For managed plugin or `codexsync` changes, run `bun run test`, `bun run lint`, `bun run codex:validate`, and `bun run codex:check`; if cache drift is reported, run `bun run codex:sync` and then `bun run codex:check` again.
- For targeted day-to-day validation, run the narrowest check that matches the surface you changed, such as:

```sh
bun skills/skill-author/scripts/validate-skill.js --skill-dir skills/javascript-author
```

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
