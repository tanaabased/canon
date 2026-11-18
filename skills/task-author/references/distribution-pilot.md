# Task Author Distribution Build

Edit `skills/task-author/SKILL.source.md` and the command sources. Use paths relative to the source
instruction file for links and `<skill-path>/scripts/…` for command invocations. The build maps
command and resource paths through `build.config.js`, then inserts the packaged execution
instructions from `templates/packaged-command-execution.md` at the marker.

Run `bun run build:task-author` from Canon's checkout to preview the installed skill at
`dist/task-author/`. Add any new shared policy references, including transitive links, to the
resource mappings. Use source links for other-skill handoffs and development resources.

Release jobs run `bun run build:task-author --release` after stamping the version. This stages a
complete skill, then places the generated instructions, four bundles, local policy copies, and
integrity inventory at `skills/task-author/` in the prepared checkout. The repository publisher
commits those outputs for Cloud alongside the authored sources. Keep generated output out of
routine source changes. Task Decomposer imports Task Author's source modules directly, so keep
them at their existing paths.

Run `bun run check:task-author` in a prepared checkout to compare what will ship with a fresh build.
Run `bun run test` for the copied-command and shared-consumer checks. After a normal release and
Cloud update, verify that a fresh chat discovers the skill, can read its local references, and can
run the read-only draft with a verified temporary command copy.
