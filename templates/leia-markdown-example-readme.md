# EXAMPLE NAME Example

Use this starter when a repo needs a Leia-backed scenario that doubles as both executable coverage and durable example documentation.

Keep the scenario focused on one user-visible flow. Put any supporting fixtures beside this README in the same example directory.

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

## Destroy tests

```bash
# should remove only the artifacts created by this scenario
rm -rf .tmp/home
```

## Notes

- Keep assertions shell-native and focused on observable behavior, not internals.
- Use example-local `.tmp/` paths so cleanup is deterministic, but avoid deleting shared example-local temp roots by default.
- Keep Leia tests inside fenced code blocks, start each test with `# should ...`, and use blank lines only between tests rather than inside a single test body.
- Add fixtures in this example directory when the scenario needs Brewfiles, dotpackages, keys, or other support files.
- For broad runtime scenarios such as `options` or `envvars`, make the final `Setup` test run the real script once, then inspect the resulting machine state in `Testing`.
- For CLI-contract scenarios, prefer direct checks such as `script-under-test.sh --help | grep ...`, `test -n "$(script-under-test.sh --version)"`, or inline status checks.
- Capture output to files only when direct inspection is awkward or when failure output is the contract under test.
- If the real product surface is a generated `dist/` entrypoint, make the workflow put `dist/` on `PATH` before Leia runs.
- If the real script can safely run in CI, prefer that over fake bootstrap stubs.
- If the scenario mutates machine state, installs packages, or uses secrets, prefer CI-only execution on fresh runners.
