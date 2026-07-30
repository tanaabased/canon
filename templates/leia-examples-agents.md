# Leia Example Guidance

This file is the compact ambient projection of the shared Leia scenario contract. It applies when editing `examples/**`; scenario README files are executable specs that may be consumed in CI, and some scenarios may mutate hosted runners.

## General Style

- Prefer behavior-focused `# should` labels over scenario labels.
- Keep each `# should` block focused on one observable contract. Split blocks whose title needs `and` or `or`, mixes unrelated domains, or grows past roughly 12 to 15 command lines unless the block is one coherent multiline command.
- Treat each blank-line-separated Leia block as a separate script. Do not rely on shell variables, functions, or working-directory changes persisting across blocks.
- Keep commands directly beneath their `# should ...` line and separate tests with one blank line.

## Scenario and Fixture Ownership

- Add coverage to the narrowest existing scenario that owns the behavior. Add a scenario only for incompatible setup, a distinct runtime lifecycle, or a separate matrix identity.
- Keep scenario-specific setup, assertions, and cleanup in its README.
- Prefer checked-in static inputs over commands or helpers that synthesize the same constant files on every run.
- Keep scenario-owned fixture files and named input directories directly beside the README without a generic scenario-local `fixtures/` wrapper.
- Hoist fixtures to root `fixtures/` only when two or more live scenarios share the same contract. Reuse repository-owned product assets directly when they are the intended input.
- Avoid `examples/fixtures` and `examples/support` when immediate children of `examples/` are CI matrix identities.

## Assertions and Helpers

- Prefer direct fixed-string pipelines for one invocation with one output assertion.
- Capture output only when one stateful invocation supports multiple assertions, complete failure or non-leak output is required, background output must be inspected later, or the output artifact is itself the contract.
- Inspect existing product logs directly when they are the observable lifecycle or safety record.
- Keep product behavior assertions and scenario-specific expected values visible in the owning README or fixture; do not hide them in shared helpers.
- Prefer semantic tokens over terminal spacing, color escapes, or complete human prose unless exact rendering is the supported contract.
- Use ordinary shell for straightforward assertions and scenario-local process coordination. Use JavaScript only when structured semantics, portability, or coordination complexity would be materially worse in shell.
- Do not add preflight existence checks when the immediately following product command validates the same prerequisite clearly. Retain them when the state itself is under test or the check materially improves failure diagnostics.
- Keep scenario-specific helpers beside their scenario and hoist only helpers shared by multiple scenarios or owning substantial semantic parsing or process coordination.
- Unit-test reusable helper decisions, not thin shell composition or third-party behavior.

## Runtime and Process Boundaries

- Store runtime-derived paths, process IDs, snapshots, and stateful results under the scenario's `TMPDIR`; do not treat that evidence as fixture material.
- When product behavior mutates a checked-in input tree, copy it under the scenario's `TMPDIR` first and run against the copy; keep the checked-in source deterministic.
- Prefer bounded readiness and shutdown polling against meaningful product signals over fixed sleeps.
- Run the real prepared product surface when CI can do so safely. Fixtures may prepare inputs but must not bypass public registration, onboarding, migration, or mutation behavior under test.
- Keep externally registered or shared resources unique per scenario and run.
- Omit cleanup that only erases ephemeral runner state. Add `## Cleanup` only for product teardown behavior, persistent resources, or shared-environment isolation.

## Model-Backed Scenarios

- Avoid a live AI model when static configuration, fixtures, or deterministic assertions can prove the contract without model execution.
- When a live model is required and its identity or quality is not under test, use the lowest-cost generally available model that supports the required provider and capabilities.
- Keep one CI-configurable model default, minimize model calls, tokens, and retries, and document any need for a larger, specialized, or exact model.
- Scope model credentials and model-specific environment to model-backed scenarios only.

## Generator and Package Boundaries

- Do not use literal backticks or braced shell expansions inside executable Leia blocks.
- Do not use numeric backreferences `\0` through `\9` inside executable Leia blocks. Leia embeds each block in a JavaScript template literal, so JavaScript consumes or rejects those escapes before the shell receives them; rewrite the command without numeric backreferences or move it to a checked-in script.
- Treat Leia's generated `.js` test harness as CommonJS runtime code when it uses `require`.
- In an ESM repository, keep `examples/package.json` with `"type": "commonjs"` whenever Leia writes its generated harness beneath `examples/`, including through a repo-local `TMPDIR` such as `examples/.tmp`.
- Do not require this boundary when the harness is outside the ESM package scope or already inherits a nearer CommonJS boundary.
- Run mutating, secret-backed, or platform-dependent scenarios in fresh CI by default; do not run them locally unless the user explicitly requests operational validation.
