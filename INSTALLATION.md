# Installation

Install [Canon](./README.md) in Codex or OpenClaw from a published package or a local checkout. Both hosts use the same skills and separate native manifests.

Have Bun available for bundled scripts, and `git` plus an authenticated `gh` CLI for repository work.

## Codex

Requires Node and npm supported by [Codex Tools](https://github.com/tanaabased/codex-tools/blob/main/CLI.md#invocation). Codex Tools 1.0.2 or newer provisions its own verified Codex CLI; you do not need a separate CLI on `PATH` for this installation path.

```sh
npx --yes --package=@tanaab/codex-tools@1 -- codex-tools install npm:@tanaab/canon
```

`npx` fetches Codex Tools as needed; no global installation is required. Codex Tools registers the marketplace and installs the plugin while preserving existing entries. Start a fresh Codex task and invoke a [Canon skill](./README.md#skills).

To select a prerelease or fixed version, append `@edge` or `@<version>` to `npm:@tanaab/canon`. Run the installation command with the desired selector again to upgrade; cache synchronization does not upgrade a published package. For manual marketplace setup, see the [Codex marketplace contract](https://developers.openai.com/plugins/build/plugins#marketplace-metadata).

### Local checkout

After [development setup](./DEVELOPMENT.md#setup), use the repository's installed dependency:

```sh
bun run codex-tools install .
```

When switching an existing installation from archives, npm, or another checkout, retain its marketplace identity and replace its source rather than installing a second copy. See [Codex Tools installation options](https://github.com/tanaabased/codex-tools/blob/main/CLI.md).

## OpenClaw

Requires OpenClaw 2026.9.5 or newer. Install from ClawHub:

```sh
openclaw plugins install clawhub:@tanaab/canon --accept-capabilities
```

For direct npm installation, use `npm:@tanaab/canon` instead. Append `@edge` or `@<version>` to select a prerelease or fixed version. Follow the command's activation instructions; supported plugins can activate without a Gateway restart. See [OpenClaw installation and updates](https://docs.openclaw.ai/tools/plugin).

### Local checkout

```sh
openclaw plugins install --link /path/to/canon
```

Follow the source-trust prompt. Use `openclaw plugins reload tanaab` after changing the linked plugin, and start a fresh session when testing updated skill guidance.

### Optional guidance

The plugin exposes its skills without extra configuration. To enable the brief reminder to prefer relevant Canon skills, grant the hook conversation access:

```sh
openclaw config set plugins.entries.tanaab.hooks.allowConversationAccess true
```

The hook appends static guidance without replacing the prompt or overriding user and project instructions. It respects OpenClaw's `allowPromptInjection` policy. Set `plugins.entries.tanaab.config.guidance` to `false` to disable the reminder while retaining the skills.
