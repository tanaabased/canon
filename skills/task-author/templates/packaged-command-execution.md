### Packaged Command Execution

The installed commands are standalone Bun scripts. Use the local skill directory as
`<skill-path>` when the host exposes it.

If the host exposes only readable resources, read `runtime-files.json` in the installed skill
and select the required command. Read the complete resource, including every page, and write the
exact bytes to its listed path in a fresh task-local temporary directory. Verify the byte length
and SHA-256 against the inventory before you run it. If the read is incomplete or either check
fails, stop and report the failure.

Use the temporary directory as `<skill-path>`. Keep the current project's working directory,
environment, and `PATH`, and pass request JSON through standard input. Read the reference
documents directly through the skill reader.
