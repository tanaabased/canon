# Task Author Distribution Build

From Canon's checkout, run `bun run build:task-author` after changing Task Author's commands or
their dependencies, or any shared reference listed in `build.config.js`. The build refreshes
`skills/task-author/dist/`, `references/canon/`, and `runtime-files.json` inside the actual skill.
Include those generated files in the same commit as the source change. Do not edit them directly.

`SKILL.md` is the shipped instruction file. Edit its command paths and execution guidance directly;
there is no separate generated skill or manual upload. Keep source code in `scripts/`, `lib/`,
`utils/`, and `test/`. Other skills still import some of those modules.

The skill-local `build.config.js` declares executable destinations and resource mappings. Bun
follows code and JSON imports. Shared policy remains authoritative in Canon's root references;
the build copies it into `references/canon/` and rewrites its simple inline Markdown links.
Declare transitive resources too. `sourceLinks` is only for other-skill handoffs, never a way to
omit required operating policy. Locally authored files map to themselves and are not rewritten.

Run `bun run check:task-author` to detect stale or missing generated files without changing them.
`bun run lint` includes that check. Run `bun run test` for behavior checks, including execution of
text-copied bundles against a disposable fake `gh`, and validate the actual skill with
`bun skills/skill-author/scripts/validate-skill.js --skill-dir skills/task-author --container codex-plugin --namespace tanaab`.

The ordinary Canon package includes this directory. Release preparation rebuilds after version
stamping and source formatting; extracted-package validation checks the shipped files against
the prepared source. No install-time build is required. Cloud discovery, resource reads, and
execution still require the installed-release trial; local checks do not establish those outcomes.
