### Packaged Command Execution

This skill's commands are prebuilt single-file Bun scripts. Require Bun and the host-provided
`gh`; do not install dependencies or compile the scripts before running them.

- If the host only supplies readable skill resources, read the [runtime file inventory](./runtime-files.json) from this installed
  skill and select the required command. Read its complete resource through the ordinary skill
  reader, following every page without truncation. Write the exact contents into a fresh task-local
  temporary directory at the listed relative path. Verify its byte length and SHA-256 against the
  inventory before execution. If a read is incomplete or verification fails, stop; do not reconstruct
  the code, fetch a different release, or execute a partial copy.
- Use that temporary directory as `<skill-path>` for the copied command. Keep the task's working
  directory, environment, and `PATH` unchanged. The executable may live elsewhere; do not `cd` into
  its directory. Continue sending request JSON through standard input under the existing rules.
- Read policy documents directly through the skill reader. Each command needs only its listed
  JavaScript file. Use files from the current installed release and a fresh temporary copy.
- Source links to other skills are handoffs: discover and load the applicable installed skill from
  the catalog when needed. Development source and test links are for maintenance in Canon's checkout,
  not runtime dependencies. Copying files grants no additional execution or publication authority.
