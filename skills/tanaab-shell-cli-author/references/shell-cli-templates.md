# Shell CLI Template Notes

Use these notes when applying the local shell CLI starters bundled with `tanaab-shell-cli-author`.

## Included Starters

- `bash-cli.sh` is the starter for Bash CLI entrypoints that need consistent `--help`, `--version`, `--debug`, and `--force` handling plus shared stdout, stderr, and debug logging helpers.
- `powershell-cli.ps1` is the starter for PowerShell CLI entrypoints that need the same Tanaab color palette, `SCRIPT_VERSION` stamping contract, env-backed defaults, logging helpers, and help output shape while using conventional PowerShell parameters such as `-Force`, `-Item`, `-Debug`, `-Version`, and `-Help`.

## Shared Rules

- Both starters follow the shared CLI style rules for help section order, status colors, stream discipline, and option-over-env precedence.
- Both starters include a repeatable `item` example backed by `TANAAB_ITEM=a,b`.
- Both starters keep one injection-friendly top-level `SCRIPT_VERSION` assignment so release tooling can stamp the entrypoint in place.
- Both starters respect `NO_COLOR` and `FORCE_COLOR` when deciding whether to emit ANSI styles, but those generic env vars are intentionally not listed in help output.

## Adaptation Notes

- Copy the relevant starter into the repo entrypoint location and rename it to match the command it provides.
- Keep shebang-bearing copied entrypoints executable.
- Replace the top-of-file description, version fallback policy, help rendering, argument handling, and main runner function with project-specific behavior, but keep the stampable `SCRIPT_VERSION` assignment unique.
- Treat `SCRIPT_VERSION` as internal release metadata rather than a documented environment contract unless a specific repo intentionally opts into that behavior.
- Run `shellcheck` on the final Bash script after adapting the template.
- If PowerShell is available, parse-check the final `.ps1` script before shipping, and run `PSScriptAnalyzer` when the repository already uses it.
