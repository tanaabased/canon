# Bun CLI Template Notes

Use these notes when applying the local Bun CLI starter bundled with `tanaab-javascript-cli-author`.

## Starter Shape

- `bun-cli.js` is the starter for true Bun CLI entrypoints that need consistent `--help`, `--version`, and `--debug` handling plus shared stdout, stderr, and debug logging helpers.
- The starter uses `ansis` for `bold(text)`, `dim(text)`, `green(text)`, `red(text)`, `yellow(text)`, and extended `tp(text)` / `ts(text)` Tanaab colors so built-in and branded styles come from one library.
- The starter also includes generic `note()` and `success()` helpers so the branded pink and semantic green styles are exercised in a reusable way.
- The starter follows the same precedence model as the shell CLI templates: explicit CLI option, then environment variable, then hardcoded default.
- The starter includes a repeatable `--item` example backed by `TANAAB_ITEM=a,b` so multi-value option handling is scaffolded from the start.

## Version Surface

- The starter keeps a top-level `let SCRIPT_VERSION;` placeholder plus fallback logic so release tooling can stamp the built entrypoint.
- The default fallback chain mirrors the shell starters: `git describe --tags --always --abbrev=1`, then `0.0.0-unreleased`.
- Treat `SCRIPT_VERSION` as internal release metadata rather than a documented environment contract unless a repo intentionally opts into that behavior.

## Usage Notes

- Copy the starter into a repository `bin/` directory and declare it in `package.json` as a real CLI entrypoint.
- Keep the shebang and commit the copied entrypoint executable.
- Keep the entrypoint and its dependencies friendly to `bun build` when the CLI is meant to ship as a built artifact.
- Install helper dependencies such as `ansis`, `debug`, and `yargs-parser` only when the CLI surface actually justifies them.
- Replace `CLI_NAME`, `DEBUG_NAMESPACE`, `getScriptVersion()`, `buildDefaults()`, `buildEnvironment()`, `buildRepeatableOptions()`, `buildEnvironmentVariables()`, and `runCli()` with project-specific behavior.
- Extend the parser, `buildEnvironment()`, and help text only after deciding the CLI contract. Keep the generic flags unless there is a strong reason not to.
- `ansis` respects `NO_COLOR` and `FORCE_COLOR`, but the starter intentionally omits those generic env vars from help text by default.
- Prefer static imports and validate Leia scenarios against the built CLI artifact when that artifact is the real shipped surface.
