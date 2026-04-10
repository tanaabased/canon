# CLI Style Rules

Use these rules when shaping CLI output for Bash, PowerShell, and Bun-backed CLIs in Tanaab-managed repos.

- Treat this file as the shared CLI contract layer. Runtime- or shell-specific skills should add only local deltas instead of restating the whole surface.
- Pair this reference with [coding-stack-preferences.md](./coding-stack-preferences.md) for runtime defaults and with the owning CLI skill for implementation details.

## Goals

- Keep Bash, PowerShell, and Bun CLIs visually consistent where runtime conventions allow it.
- Color only the key action, target, or status word rather than whole sentences.
- Keep semantic status colors separate from brand accent colors.
- Preserve readable output when color is unavailable or disabled.

## Style Surface

- `bold`: emphasis for the command name, important status words, or compact inline emphasis
- `dim`: supporting context such as defaults, parenthetical notes, or secondary hints
- `green`: semantic success state such as `done`, `complete`, or `installed`
- `yellow`: semantic warning state such as `warn`
- `red`: semantic failure state such as `error`
- `tp`: Tanaab green `#00c88a` for section headers and key verbs such as `install`, `write`, `stow`, or `backup`
- `ts`: Tanaab pink `#db2777` for important targets, focal nouns, or resolved destinations such as filenames, package groups, directories, or tool names

## Help Output

- Print help sections in this order when present: `Usage`, `Options`, `Environment Variables`.
- Include `Environment Variables` only when the CLI defines tool-specific or repo-specific env vars that are part of its documented contract.
- Wrap `Options` and `Environment Variables` section headers in the `tp` style when those sections are present.
- Back `--version` with a single `SCRIPT_VERSION` variable or an explicitly aligned equivalent rather than duplicating the reported version across helpers and help text.
- Use the same precedence order across Bash and Bun CLIs: explicit CLI option, environment variable override, then auto-detected or hardcoded default.
- For repeatable options, accept repeated CLI flags such as `--item a --item b` and represent environment defaults as comma-separated values such as `TANAAB_ITEM=a,b`.
- When a repeatable CLI option is provided at least once, it should replace the env-sourced list rather than append to it implicitly.
- Show computed defaults in `dim` styling when that improves clarity.
- Keep help text readable without color; color should reinforce structure, not carry it alone.

## Logging Rules

- In Bash and Bun CLIs, write normal command output to `stdout`.
- In Bash and Bun CLIs, write warnings, debug output, and failures to `stderr` when they are diagnostic rather than primary tool output.
- In PowerShell CLIs, prefer native streams: `Write-Output` for primary output, `Write-Host` or `Write-Information` for display-only status text, `Write-Warning` for warnings, `Write-Debug` for debug output, and `Write-Error` plus `exit` or `throw` for failures.
- Use semantic colors for status labels such as `warn`, `error`, or `done`.
- Use `tp` on the key verb in an action message and `ts` on the key target or destination.
- Avoid coloring entire sentences unless the message is itself a compact status label.
- Prefer a small shared helper surface such as `log`, `note`, `success`, `warn`, `fail`, or their shell equivalents over ad hoc inline formatting.

## Implementation Notes

- Files meant for direct execution should start with a shebang and be committed executable.
- Do not mark repo-authored files executable unless they actually start with a shebang.
- In shell, prefer `tty_*` helpers or variables such as `tty_tp`, `tty_ts`, `tty_dim`, `tty_bold`, `tty_green`, `tty_red`, and `tty_yellow`.
- In PowerShell CLIs, prefer one small local helper layer that exposes the shared style names `bold`, `dim`, `green`, `red`, `yellow`, `tp`, and `ts` while still using conventional PowerShell parameters such as `-Force` and `-Help`.
- In PowerShell CLIs, normalize `-Debug`, repo-specific debug env vars, and an already-enabled `$DebugPreference` into native `Write-Debug` output instead of inventing a second debug channel.
- In Bun CLIs, prefer one shared styling mechanism for both semantic colors and branded colors so calling code only deals with style names, not raw ANSI escapes.
- Respect terminal color controls such as `NO_COLOR` and `FORCE_COLOR` when the chosen helper layer supports them.
- Do not list generic terminal control or debug env vars such as `NO_COLOR`, `FORCE_COLOR`, `DEBUG`, or `RUNNER_DEBUG` in help text unless the CLI defines a non-obvious contract around them.

## Version Surface

- For releasable or user-facing CLIs that may be stamped by release automation, keep one injection-friendly top-level `SCRIPT_VERSION` declaration or assignment line in the entrypoint.
- In Bun or JavaScript CLIs, prefer `let SCRIPT_VERSION;` plus fallback initialization from git metadata or a hardcoded default when unstamped source still needs a usable `--version` value.
- In shell CLIs, prefer a single top-level `SCRIPT_VERSION=...` or `$SCRIPT_VERSION = ...` assignment that resolves environment override first, then git metadata, then an unreleased fallback such as `0.0.0-unreleased`.
- Treat `SCRIPT_VERSION` as internal release metadata rather than a documented environment contract unless a repo explicitly opts into that behavior.
