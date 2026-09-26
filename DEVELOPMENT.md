# Development

Contributor setup, validation, and release preparation for [Canon](./README.md). For using the plugin, see [Installation](./INSTALLATION.md).

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

`bun run test` runs unit tests; `bun run lint` checks code and formatting. The [OpenClaw example](https://github.com/tanaabased/canon/blob/main/examples/openclaw/README.md) owns packed installation, skill discovery, and guidance opt-out coverage. Its matrix-based [Examples workflow](https://github.com/tanaabased/canon/blob/main/.github/workflows/pr-examples-tests.yml) supplies OpenClaw and runs Leia on isolated CI runners; do not run the mutating scenario against your normal profile.

Check the actual npm payload without installing dependencies into it:

```sh
npm pack --ignore-scripts --pack-destination /tmp
version="$(bun -p '(await Bun.file("package.json").json()).version')"
candidate="$(mktemp -d)"
tar -xzf "/tmp/tanaab-canon-$version.tgz" -C "$candidate" --strip-components=1
bun run check:package "$candidate"
```

The package check validates skill/resource links, loads entrypoints, scaffolds a skill, and renders issue forms outside the checkout. Release Tests separately stamp a synthetic version, validate the extracted artifact, and dry-run npm, ClawHub, and repository publication.

## Codex cache

`bun run codex:check` inspects installed-cache drift; `bun run codex:sync` refreshes a development installation. Neither command publishes or upgrades an npm release. For a disposable raw cache, pass an isolated `--codex-home`, `--cache-path`, and `--missing-target create`; this checks synchronization, not installation. See [Codex Tools](https://github.com/tanaabased/codex-tools/blob/v1.0.2/CLI.md) for options.

## Release preparation

Release publication uses npm trusted publishing for `tanaabased/canon` and `.github/workflows/release.yml`. Before the first npm release, establish the package and configure that publisher in npm. `TANAAB_NPM_DEPLOY` supplies only stable-to-`edge` alias updates; package publication uses OIDC. ClawHub publication uses `TANAAB_LOBSTER_BOAT`, whose actor needs publishing access to owner `tanaab`. Repository synchronization retains `TANAAB_COAXIUM_INJECTOR`. All three jobs stamp the same release version into the package and both plugin manifests.

See [AGENTS.md](./AGENTS.md#canon-design) for directory ownership and the [architecture guide](./guidance/skills-agents-canon-model.md) for context loading and packaging.
