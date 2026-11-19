### Packaged Command Execution

Use the installed skill directory as `<skill-path>` when the host exposes it.

If the host exposes only readable resources, select the command in `runtime-files.json`.
Copy the command and any listed `resources` to their exact paths in a fresh task-local
temporary directory. Read every page and preserve the original bytes. Verify each file's
byte length and SHA-256 against the inventory before running the command. Stop if any
file is unavailable, incomplete, or fails verification.

Use the temporary directory as `<skill-path>`. Run the command from the current project
with its existing environment and `PATH`. Use the arguments specified by the skill and pass request JSON through
standard input when the command accepts it. Read the reference documents directly through the skill reader.
