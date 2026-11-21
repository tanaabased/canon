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

Follow the [Canon skill contribution guide](./skills/AGENTS.md) when creating or editing skills. The [PR release rehearsal](./.github/workflows/release-tests.yml) builds the skills in a disposable Git checkout, packs the plugin, and verifies the extracted tarball. Use the rehearsal results to check your changes before merging.

Run `bun run build:plugin` only in CI. The build modifies tracked skills in place and leaves the Git index available to `bun run check:package` for verification. The [release workflow](./.github/workflows/release.yml) uses the same build and verification commands.

## Codex cache

`bun run codex:check` inspects cache drift; `bun run codex:sync` synchronizes the selected cache. Keep development verification isolated: pass an isolated `--codex-home`, `--cache-path`, and `--missing-target create` to both commands. This checks synchronization, not installation, and neither command publishes or upgrades an npm release. Drift against a task worktree does not require updating the live installation. See [Codex Tools](https://github.com/tanaabased/codex-tools/blob/main/CLI.md) for options.

For Me-managed installations, deliberately update the designated source checkouts to merged `main`, then request Agent System Install against the trusted Me binding with unchanged installation inputs. Install checks and repairs the declared plugin caches; the authorized nightly refresh uses the same flow. Do not invoke Install or direct live cache sync as part of routine development validation.

## Release preparation

Use trusted publishing for npm publication and `latest`-to-`edge` channel syncing from `tanaabased/canon` and `.github/workflows/release.yml`, with `npm publish` and `npm dist-tag` permissions. No npm token is required; see the [npm publishing contract](./references/coding-stack-preferences.md#npm-package-publishing).

ClawHub publication is a required release job and uses `TANAAB_LOBSTER_BOAT`, whose actor needs publishing access to owner `tanaab`. Repository synchronization retains `TANAAB_COAXIUM_INJECTOR`. All three jobs stamp the same release version into the package and both plugin manifests.

See [AGENTS.md](./AGENTS.md#canon-design) for directory ownership.
