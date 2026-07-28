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

## Notes

- Keep assertions shell-native and focused on observable behavior, not internals.
- Use example-local `.tmp/` paths to isolate runner-local artifacts; do not add cleanup solely to delete them on an ephemeral GitHub Actions runner.
- Add an optional `## Cleanup` section only when teardown is part of the product contract, resources can persist or interfere beyond the runner, or later scenarios share the environment. Keep it limited to resources created by this scenario.
- Keep Leia tests inside fenced code blocks, start each test with lowercase `# should ...` prose, avoid camelCase or PascalCase prose, and use blank lines only between tests rather than inside a single test body.
- Preserve uppercase or mixed-case terms in `# should ...` descriptions only when they are exact literals or conventional identifiers, such as environment variables, command names, flags, paths, file formats, acronyms, HTTP methods, status or error codes, or expected output strings.
- Inside executable Leia blocks, do not use literal backticks or braced shell expansions such as `${VAR}`; use `$(command)` and `$VAR` instead.
- Move shell logic that requires braced parameter expansion into a checked-in example-local helper script.
- Add fixtures in this example directory when the scenario needs Brewfiles, dotpackages, keys, or other support files.
- For broad runtime scenarios such as `options` or `envvars`, make the final `Setup` test run the real script once, then inspect the resulting machine state in `Testing`.
- For CLI-contract scenarios, prefer direct checks such as `script-under-test.sh --help | grep ...`, `test -n "$(script-under-test.sh --version)"`, or inline status checks.
- Prefer direct output assertions such as `command | grep -F ...` for simple stdout/stderr checks.
- In runtime scenarios, prefer observable state such as installed files, command availability, service status, and generated config over setup-log assertions.
- Capture output to files only when the output itself is the contract, a failure-path assertion needs full stdout/stderr, a secret non-leak assertion needs complete output, or one expensive command output must be reused across multiple assertions.
- Do not capture setup output just to assert internal argv assembly when state or user-facing command behavior can be checked directly.
- If the real product surface is a generated `dist/` entrypoint, make the workflow put `dist/` on `PATH` before Leia runs.
- Leia's generated `.js` harness uses CommonJS `require`. When the repository is ESM and `TMPDIR` is beneath `examples/`, commit the shared `examples/package.json` starter with `"type": "commonjs"` even if the repository owns no JavaScript helpers; omit it when the generated harness is outside the ESM package scope or already has a nearer CommonJS boundary.
- If the real script can safely run in CI, prefer that over fake bootstrap stubs.
- If the scenario mutates machine state, installs packages, or uses secrets, prefer CI-only execution on fresh runners.
