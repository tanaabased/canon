# JavaScript and TypeScript Function Tests

Use these criteria for JavaScript or TypeScript unit and component tests, including existing passing suites.

## Direct-Test Pattern

Apply the shared [Testing Defaults](../../../references/coding-stack-preferences.md#testing-defaults) for tools, test placement, naming, and coverage.

- Keep each spec scoped to one helper surface and assert observable return values or narrow boundary behavior.
- Hoist tests only when their implementation is also hoisted or the coverage is intentionally cross-scope.
- When TypeScript is present, make sure the repo's test command discovers `.spec.ts` and run `typecheck` separately from the test runner.
- Apply the shared [admission and retention gate](../../../references/verification-boundaries.md#assertion-strength). Identify the consequential wrong decision, transformation, or effect and how the assertion rejects it; a helper's existence does not require its own test. Remove low-value cases without replacement when their maintenance cost exceeds the protection, even if they are unique and fast.
- Keep isolated edge cases in units and retain component coverage where real internal wiring can fail despite correct individual helpers. Packaging, installed CLI behavior, and native-host integration use their respective owners' criteria even when the test is written in JavaScript or TypeScript.
- Compare meaningful failures before retaining permutations. Keep distinct consequential failures, not a case for every combination; testing a third-party dependency's own guarantees belongs upstream.
- Audit fixture size and coupling independently of runtime. Exercise pure validation directly instead of preparing a whole dispatch or installation fixture. A component must exercise real internal cooperation, but needs no filesystem, OS, or process setup unless that boundary is the subject. Shrink setup to the behavior it proves.
- Mock external boundaries while exercising owned decisions and internal cooperation. Supplying a canned response and expecting its scripted mock calls is insufficient unless real owned logic could make a consequential wrong choice that the assertions detect. Keep calls that prove a required or prohibited external effect; discard incidental internal call order and counts.

## Contract Durability

### Assert According to Contract Strength

- Apply [Assertion Strength](../../../references/verification-boundaries.md#assertion-strength): test observable decisions and effects against an independently defined contract, and reserve exact implementation details for cases where those details are contractual.
- When order is not part of the contract, compare membership rather than array position.

### Keep Prose Assertions With Their Owner

- A formatter or logger may test its consequential owned prefix, redaction, and rendering contract exactly; ownership alone does not justify freezing every word.
- Callers should check required semantic context or the relevant effect, not repeat the renderer's width, color, and formatting permutations or demand an incidental internal call.
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
- Use the [shared testing layers](../../../references/coding-stack-preferences.md#testing-defaults) to place native-boundary coverage: a component may use a small isolated filesystem, socket, or process fixture when that contract is the subject; installed functional flows belong in the owning [Leia scenario](../../../references/leia-markdown-scenarios.md).

### Test Adapters Without Re-Testing Dependencies

- Test the decisions made by local adapters: input mapping, policy enforcement, error handling, retries, and returned results.
- Do not reproduce a third-party library's own behavior matrix in local unit tests.
- Exercise real internal adapters through a bounded component when their wiring is the contract; use the owning Leia scenario for installed dependency or public consumer compatibility.

### Preserve Strong Safety Coverage

- Keep exact assertions for fail-closed behavior, redaction, authorization, denial decisions, protocol method names, hook priority, serialized audit records, and other security-relevant contracts.
- Treat a test that fails after an intentional safety-contract change as useful friction, not brittleness.
- Loosen only assertions whose failure does not indicate a real compatibility, correctness, or safety regression.

### Short Examples

- **Owned output versus incidental prose:** test an exact rendering contract where a deviation matters; in callers, assert the stable error code and required context rather than copying that sentence.
- **Ordered protocol versus unordered membership:** use `assert.deepEqual(actual, expected)` when sequence is contractual; otherwise compare `new Set(actual)` with `new Set(expected)`.
- **Canonical version versus release literal:** assert `runVersion() === packageJson.version`; use a synthetic value such as `9.8.7-test` when testing propagation or mismatch handling.
- **Injected time versus fixed sleep:** pass a fake clock or scheduler and assert the requested deadline or callback; do not sleep and infer success from a timing window.
- **Local adapter versus dependency behavior:** stub the dependency for local mapping and policy decisions; exercise real internal wiring in a bounded component, and installed compatibility through the owning Leia scenario.

## Starter Shapes

- `transform-unit.js` is the starter shape for pure or mostly pure transformation helpers.
- `async-boundary-unit.js` is a function-shape starter that reads a filesystem boundary and passes data to smaller helpers. Its filename does not classify tests: inject the read for strict units and use an isolated filesystem fixture for a component exercising the native contract.
- Both starters prefer early returns, straight-line derived constants, and minimal mutation.
- When imports are needed, group them in built-in, external, and local blocks with a single blank line between blocks.
