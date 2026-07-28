# Leia Example Guidance

This file applies when editing `examples/**/README.md`. These README files are executable Leia specs that may be consumed in CI, and some scenarios may mutate hosted runners.

## General Style

- Prefer behavior-focused `# should` labels over scenario labels.
- Keep each `# should` block focused on one observable contract. Split blocks whose title needs `and` or `or`, mixes unrelated domains, or grows past roughly 12-15 command lines unless the block is one coherent multiline command.
- Treat each blank-line-separated Leia block as a separate script. Do not rely on shell variables, functions, or working-directory changes persisting across `should` blocks.
- Prefer direct command pipelines, command substitutions, and deterministic inline values over writing files just to inspect them later.
- Do not capture command output into shell variables just to grep it later. If capture is needed to preserve a failing command's status, print the captured output before assertions.
- For report-style assertions, print and match targeted output before running the final gate so CI logs show the mismatch that caused the failure.

## Example Placement

- Add coverage to the narrowest existing example that owns the behavior.
- Add a new example only when the behavior needs incompatible setup inputs, crosses enough domains to blur an existing example, or intentionally needs another successful product run.
- Keep scenario-specific setup, assertions, and cleanup in the scenario README rather than in this file.

## Runtime Boundary

- Treat Leia's generated `.js` test harness as CommonJS runtime code because it uses `require`, even when the repository owns no example-local JavaScript helpers.
- In an ESM repository, keep `examples/package.json` with `"type": "commonjs"` in place whenever Leia writes its generated harness beneath `examples/`, including through a repo-local `TMPDIR` such as `examples/.tmp`.
- Do not require this examples-level boundary when the generated harness lives outside the ESM package scope or already inherits a nearer CommonJS boundary.
- Do not move example-only helper modules to the repo root just to inherit the root package type.
- Keep fixtures beside the scenario that owns them unless two or more scenarios already share the same fixture contract.

## Mutating Examples

- Mutating examples should run the prepared product entrypoint once unless the example is explicitly about rerun or idempotency behavior.
- Use fixed, readable local resource names for resources that exist only on ephemeral runners. Keep externally registered or shared resources unique per scenario and run.
- Do not add preemptive cleanup or destroy blocks just to reset hosted runner state; each matrix job should start on a fresh runner.
- Do not add expected-failure probes to mutating bootstrap examples when the failure can occur after machine state changes. Keep failure-contract checks in non-mutating CLI examples or make them fail during input validation before bootstrap side effects.

## Shell Fixtures

- Use `TMPDIR` for durable fixtures, unavoidable logs, and helper internals only.
- Keep generated key, token, or credential-shaped fixtures in `TMPDIR`; they are real test inputs, not scratch assertion files.
- Do not give setup fixture commands standalone `# should` blocks unless the fixture state itself is the contract. Put `mkdir -p "$TMPDIR"` beside the first fixture that writes into `TMPDIR`.
- Avoid braced shell variable expansions such as `${VAR}` when plain `$VAR` works.
