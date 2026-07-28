# JavaScript and TypeScript Function Tests

Use these defaults when validating low-coupling JavaScript or TypeScript helpers and utility functions.

## Direct-Test Pattern

- Prefer focused Mocha tests for pure or mostly pure ESM helpers.
- Keep the spec scoped to one helper surface and assert observable return values or narrow boundary behavior.
- For helper modules such as `feature/utils/x.ts`, prefer matching specs such as `feature/test/x.spec.ts`.
- Keep each scoped `test/` directory flat by default, including specs, fixtures, fakes, and support code.
- Keep specs in the nearest scope that owns the helper; hoist tests only when their implementation is also hoisted or the coverage is intentionally cross-scope.
- Use the module-under-test path without file extension as the `describe` value, relative to the repo root or nearest source root.
- Start Mocha test names with `should` so each test states the expected behavior.
- Add `c8` only when coverage reporting or enforcement is actually part of the task.
- When TypeScript is present, make sure the repo's test command discovers `.spec.ts` and run `typecheck` separately from the test runner.

## Contract Durability

### Assert According to Contract Strength

- Assert exact values for stable public, protocol, configuration, serialization, and safety contracts.
- Do not make implementation order, internal collection shape, diagnostic copy, or formatting owned by another module exact unless that detail is itself the supported contract.
- Prefer testing observable decisions and effects over reproducing implementation steps.
- When order is not part of the contract, compare membership rather than array position.

### Keep Prose Assertions With Their Owner

- A formatter or logger may test its owned prefix, redaction, and rendering contract exactly.
- Callers of that formatter should assert that the appropriate logging or error path was used and that required semantic context is present.
- Prefer stable error codes, names, or structured fields when callers need to distinguish failures. Render human-readable messages at the boundary.
- Avoid duplicating complete diagnostic, log, and error sentences across unrelated specs.

### Avoid Release-Literal Churn

- Derive expected product versions from the canonical metadata source, such as `package.json.version`.
- Do not hard-code the current release number in a test when the requirement is that output matches package metadata.
- Use clearly synthetic versions for fixtures whose purpose is equality, propagation, or mismatch detection.
- Do not weaken a canonical-version assertion into merely checking that output resembles semantic versioning.

### Keep Unit Tests Deterministic

- Inject clocks, delays, schedulers, subprocesses, network clients, and similar boundaries when unit-testing orchestration.
- Avoid fixed sleeps and assertions that nothing happened after an arbitrary number of milliseconds.
- Move genuine filesystem notification, process lifecycle, network, and platform behavior into explicitly named integration or smoke checks.
- Keep environment-sensitive checks separate from the default unit suite when they are valuable but not deterministic.

### Test Adapters Without Re-Testing Dependencies

- Test the decisions made by local adapters: input mapping, policy enforcement, error handling, retries, and returned results.
- Do not reproduce a third-party library's own behavior matrix in local unit tests.
- Use a narrow integration check only when compatibility with the actual dependency is an owned project risk.

### Preserve Strong Safety Coverage

- Keep exact assertions for fail-closed behavior, redaction, authorization, denial decisions, protocol method names, hook priority, serialized audit records, and other security-relevant contracts.
- Treat a test that fails after an intentional safety-contract change as useful friction, not brittleness.
- Loosen only assertions whose failure does not indicate a real compatibility, correctness, or safety regression.

### Short Examples

- **Owned output versus incidental prose:** test a formatter's complete rendered message exactly; in its callers, assert the stable error code and required context rather than copying that sentence.
- **Ordered protocol versus unordered membership:** use `assert.deepEqual(actual, expected)` when sequence is contractual; otherwise compare `new Set(actual)` with `new Set(expected)`.
- **Canonical version versus release literal:** assert `runVersion() === packageJson.version`; use a synthetic value such as `9.8.7-test` when testing propagation or mismatch handling.
- **Injected time versus fixed sleep:** pass a fake clock or scheduler and assert the requested deadline or callback; do not sleep and infer success from a timing window.
- **Local adapter versus dependency behavior:** stub the dependency and assert local mapping, retry, policy, and error decisions; add a separately invoked integration check only for compatibility the project owns.

## Starter Shapes

- `transform-unit.js` is the starter shape for pure or mostly pure transformation helpers.
- `async-boundary-unit.js` is the starter shape for helpers that read from a narrow boundary such as the filesystem and then hand parsed data to smaller helpers.
- Both starters prefer early returns, straight-line derived constants, and minimal mutation.
- When imports are needed, group them in built-in, external, and local blocks with a single blank line between blocks.
