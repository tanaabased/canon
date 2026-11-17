# GitHub CLI Routing

Apply this contract whenever a Canon skill or bundled command invokes GitHub CLI:

- Invoke the executable as the bare command name `gh` so the active `PATH` decides which compatible implementation runs. Do not hardcode, resolve, cache, or invoke an absolute `gh` path.
- Inherit the calling process's environment and current working directory. Do not pass `env` or `cwd` process options, replace `PATH`, or change directories merely to select a GitHub identity or target; a host harness may use `PATH` and the active workspace to bind the responsible agent.
- Select a repository through explicit GitHub CLI arguments such as `--repo OWNER/REPO` or an explicit API endpoint instead of a subprocess working-directory override.
- Preserve ordinary GitHub CLI arguments, stdin, stdout, stderr, and exit status so a compatible host shim remains transparent.
- A host-specific command such as `gh --agent-system` may diagnose routing, but it is not a Canon prerequisite and must not prefix ordinary GitHub calls.
- Treat host routing, identity, credential, and policy denials as `gh` failures. Surface the original failure and never bypass it with an absolute binary, alternate environment or credentials, or direct GitHub HTTP.
