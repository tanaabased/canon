# EXAMPLE NAME Example

Use this starter when a repo needs a Leia-backed scenario that doubles as both executable coverage and durable example documentation.

Keep the scenario focused on one user-visible flow. Put scenario-owned fixture files or named input directories directly beside this README without a generic local `fixtures/` wrapper.

## Setup

```bash
# should prepare the minimal example prerequisites
mkdir -p .tmp/home

# should run the real prepared entrypoint with the scenario inputs
CI=1 NONINTERACTIVE=1 \
EXAMPLE_MODE=enabled \
script-under-test.sh \
  --target "$(pwd)/.tmp/home" \
  --mode example
```

## Testing

```bash
# should create the installed executable in the target directory
test -x .tmp/home/bin/script-under-test.sh

# should install the expected config file
test -f .tmp/home/etc/script-under-test.conf
```

## Notes

- Assert observable behavior with shell-native checks and semantic tokens rather than internal implementation details, terminal spacing, or incidental prose.
- Keep commands directly beneath lowercase `# should ...` lines, use one behavior per block, and separate tests with one blank line.
- Capture output only when one stateful invocation supports multiple assertions, complete failure or non-leak output is required, background output must be inspected later, or the output artifact is itself the contract.
- Keep static scenario-owned inputs beside this README. Hoist fixtures to root `fixtures/` only after two or more live scenarios share the same fixture contract.
- Store runtime-derived state and evidence under `TMPDIR`; do not commit it as fixture material.
- Add `## Cleanup` only for product teardown behavior, persistent resources, or shared-environment isolation—not merely to erase ephemeral runner state.
- Prefer the real public and release-shaped product surface over local stubs or private state writes when CI can exercise it safely.
- Use a bounded readiness signal instead of a fixed sleep for process startup and shutdown.
- Inside executable blocks, do not use literal backticks or braced shell expansions such as `${VAR}`; use `$(command)` and `$VAR`, or move required shell logic into a checked-in helper.
- When an ESM repository writes Leia's generated CommonJS harness beneath `examples/`, commit the shared `examples/package.json` boundary with `"type": "commonjs"`.
- Run mutating, secret-backed, or platform-dependent scenarios on fresh CI by default and protect secrets from owned output and logs.
