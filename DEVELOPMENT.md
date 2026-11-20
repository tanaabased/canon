# Development

Set up a [Canon](./README.md) checkout, validate changes, and prepare a release. To install and use the plugin, see [Installation](./INSTALLATION.md).

## Setup

Use the Node and Bun versions in [`.node-version`](./.node-version) and [`.bun-version`](./.bun-version):

```sh
git clone git@github.com:tanaabased/canon.git
cd canon
bun install --frozen-lockfile --ignore-scripts
bun run test
bun run lint
```

## Validation

`bun run test` runs the local Mocha suite, including isolated units and components with filesystem fixtures; `bun run lint` checks code and formatting. The [Examples workflow](https://github.com/tanaabased/canon/blob/main/.github/workflows/pr-examples-tests.yml) runs Leia against the candidate tarball: [skill tools](https://github.com/tanaabased/canon/blob/main/examples/skill-tools/README.md), [CLI starters](https://github.com/tanaabased/canon/blob/main/examples/cli-templates/README.md), [Codex discovery and cache recovery](https://github.com/tanaabased/canon/blob/main/examples/codex/README.md), and [OpenClaw installation](https://github.com/tanaabased/canon/blob/main/examples/openclaw/README.md). Keep platform-dependent and host-mutating scenarios on isolated CI runners; do not run the OpenClaw scenario against your normal profile.

Follow the [Canon skill contribution guide](./skills/AGENTS.md) when creating or editing skills. Build from a Git checkout and check the actual npm payload without installing dependencies into it:

```sh
scratch="$(mktemp -d)"
CODEX_TOOLS_CLI=$(bash scripts/build-cloud-pilot-task.sh "$scratch/codex-tools")
export CODEX_TOOLS_CLI
bun run build:plugin "$scratch/plugin"
npm pack "$scratch/plugin" --ignore-scripts --pack-destination "$scratch"
version="$(bun -p '(await Bun.file("package.json").json()).version')"
mkdir "$scratch/extracted"
tar -xzf "$scratch/tanaab-canon-$version.tgz" -C "$scratch/extracted" --strip-components=1
bun run check:package "$scratch/extracted"
```

For a Codex Cloud pilot, use the plugin files from the checked `$scratch/tanaab-canon-$version.tgz` tarball. It includes the bundled commands, runtime inventories, and execution instructions.

The pilot builds Codex Tools from the pinned Git revision. Before releasing Canon, pin the npm version of `@tanaab/codex-tools` that contains the verified builder, then rerun the same checks using the installed dependency.

The build uses tracked working-tree files, including unstaged edits. Use the same source inputs when checking the extracted tarball. Run `bun test/package-cutover.js` to exercise the new-skill fixture with the same package check as Release Tests.

## Codex cache

`bun run codex:check` inspects cache drift; `bun run codex:sync` synchronizes the selected cache. Keep development verification isolated: pass an isolated `--codex-home`, `--cache-path`, and `--missing-target create` to both commands. This checks synchronization, not installation, and neither command publishes or upgrades an npm release. Drift against a task worktree does not require updating the live installation. See [Codex Tools](https://github.com/tanaabased/codex-tools/blob/main/CLI.md) for options.

For Me-managed installations, deliberately update the designated source checkouts to merged `main`, then request Agent System Install against the trusted Me binding with unchanged installation inputs. Install checks and repairs the declared plugin caches; the authorized nightly refresh uses the same flow. Do not invoke Install or direct live cache sync as part of routine development validation.

## Release preparation

Use trusted publishing for npm publication and `latest`-to-`edge` channel syncing from `tanaabased/canon` and `.github/workflows/release.yml`, with `npm publish` and `npm dist-tag` permissions. No npm token is required; see the [npm publishing contract](./references/coding-stack-preferences.md#npm-package-publishing).

ClawHub publication is a required release job and uses `TANAAB_LOBSTER_BOAT`, whose actor needs publishing access to owner `tanaab`. Repository synchronization retains `TANAAB_COAXIUM_INJECTOR`. All three jobs stamp the same release version into the package and both plugin manifests.

See [AGENTS.md](./AGENTS.md#canon-design) for directory ownership.
