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

Have Bun available for bundled scripts, and `git` plus an authenticated `gh` CLI for repository work. Both hosts use the same `@tanaab/canon` package and skills, with separate native manifests.

> npm and ClawHub distribution start with the next Canon release. Until then, use Codex's existing [release archives](https://github.com/tanaabased/canon/releases) or a local checkout.

### Codex

Use npm-backed releases through Codex's plugin marketplace, with npm available for installation.

Add this entry to your existing personal marketplace's `plugins` array in `~/.agents/plugins/marketplace.json`, preserving its name and other entries:

```json
{
  "name": "tanaab",
  "source": {
    "source": "npm",
    "package": "@tanaab/canon",
    "version": "latest"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

If you do not have a marketplace, create one with `{"name":"personal","plugins":[]}` and add the entry above. Restart the app, open Plugins, install **Tanaab Maneuvering Systems**, and start a fresh Codex task. See the [official marketplace contract](https://developers.openai.com/plugins/build/plugins#marketplace-metadata).

For upgrades, refresh the marketplace and installed plugin, then start a fresh task. Use an exact published version instead of `latest` when you need a fixed release. Existing archive users can replace their `tanaab` entry's `source` with the npm source above while retaining the marketplace name. Keep the previous local directory until the new installation works; do not install both copies.

[Codex Tools 1.x](https://github.com/tanaabased/codex-tools/blob/v1.0.0/PLUGINS.md) offers an optional CLI installation path and setup/maintenance skills. Its install commands require the supported Codex CLI; npm publishing alone does not refresh an installed plugin.

### OpenClaw

Requires OpenClaw 2026.9.4 or newer. Install from ClawHub:

```sh
openclaw plugins install clawhub:@tanaab/canon --accept-capabilities
```

For direct npm installation, use `npm:@tanaab/canon` instead; for development, use `openclaw plugins install --link /path/to/canon` and follow the source-trust prompt. Apply the Gateway reload or restart requested by your installed OpenClaw version, then start a fresh session. See [OpenClaw's installation guide](https://docs.openclaw.ai/tools/plugin).

The plugin exposes the skills without extra configuration. To enable its brief reminder to prefer relevant Canon skills, grant the hook conversation access:

```sh
openclaw config set plugins.entries.tanaab.hooks.allowConversationAccess true
```

The hook appends static guidance without replacing the prompt or overriding user and project instructions. It also respects OpenClaw's `allowPromptInjection` policy. Set `plugins.entries.tanaab.config.guidance` to `false` to disable the reminder while retaining the skills.

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

Use the Node and Bun versions in [`.node-version`](./.node-version) and [`.bun-version`](./.bun-version):

```sh
git clone git@github.com:tanaabased/canon.git
cd canon
bun install --frozen-lockfile --ignore-scripts
bun run test
bun run lint
```

To load a checkout, use Codex Tools' [local installation](https://github.com/tanaabased/codex-tools/blob/v1.0.0/CLI.md), or point the existing marketplace entry at it with `source: {"source":"local","path":"./path/to/canon"}`. Local paths are relative to the marketplace root. Preserve the marketplace name when switching sources, reinstall the plugin, and start a fresh task.

Check the actual npm payload without installing dependencies into it:

```sh
npm pack --ignore-scripts --pack-destination /tmp
version="$(bun -p '(await Bun.file("package.json").json()).version')"
candidate="$(mktemp -d)"
tar -xzf "/tmp/tanaab-canon-$version.tgz" -C "$candidate" --strip-components=1
bun run check:package "$candidate"
```

The package check validates every skill and its resource links, loads executable entrypoints, scaffolds a skill, and renders issue forms outside the checkout. GitHub Actions also runs the shared plugin validator and npm/ClawHub publication dry runs against that payload. With OpenClaw installed, `bun run check:openclaw /path/to/package.tgz` verifies native loading, skill discovery, and the hook opt-out in a disposable profile.

`bun run codex:check` inspects installed-cache drift; `bun run codex:sync` refreshes a development installation. Neither command publishes or upgrades an npm release. For a disposable raw cache, pass an isolated `--codex-home`, `--cache-path`, and `--missing-target create`; this checks synchronization, not installation. See [Codex Tools](https://github.com/tanaabased/codex-tools/blob/v1.0.0/CLI.md) for options.

Release publication uses npm trusted publishing for `tanaabased/canon` and `.github/workflows/release.yml`. Before the first npm release, establish the package and configure that publisher in npm. `TANAAB_NPM_DEPLOY` supplies only stable-to-`edge` alias updates; package publication uses OIDC. ClawHub publication uses `TANAAB_LOBSTER_BOAT`, whose actor needs publishing access to owner `tanaab`. Repository synchronization retains `TANAAB_COAXIUM_INJECTOR`. All three jobs stamp the same release version into the package and both plugin manifests.

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
