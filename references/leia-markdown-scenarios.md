# Leia Markdown Scenarios

Use this pattern when a repository needs end-to-end or operational coverage that is clearer as executable shell steps than as unit tests. A Leia scenario is both maintained example documentation and runnable contract coverage.

Treat this reference as the authoritative Leia scenario contract. `templates/leia-examples-agents.md` is its compact ambient projection for repositories that need durable `examples/**` editing rules, while `templates/leia-markdown-example-readme.md` should remain a runnable scenario starter instead of restating the editing contract.

## When to Use

- Use Leia when the main risk is observable CLI behavior, file layout, permissions, process lifecycle, service readiness, machine mutation, logs, or integration through a public product surface.
- Prefer Leia when fresh CI runners, platform matrices, secrets, or release-shaped artifacts are important to the result.
- Use unit tests for pure parsing, transformation, rendering, and helper decisions that do not require an operational runtime.
- Do not reproduce the same contract in both Leia and another end-to-end harness without a distinct risk that justifies both.

## Scenario Shape

- Put each user-visible flow in `examples/<scenario>/README.md`.
- Keep one scenario per README. Add a new scenario when the flow requires incompatible setup, a distinct runtime lifecycle, or a separate matrix identity.
- Prefer broad contract names such as `install`, `options`, `envvars`, `model`, or `agent` unless the scenario truly owns one narrow case.
- Use this default README structure:

  1. Title and one-paragraph contract summary
  2. `## Setup`
  3. `## Testing`
  4. Optional `## Cleanup`

- Keep setup minimal and run the real prepared product surface before asserting its observable results.
- Add `## Cleanup` only when teardown is part of the product contract, a resource can persist beyond the runner, or later work shares the same environment.
- Add `examples/AGENTS.md` only when executable examples need durable editing rules beyond the repository root guidance.

## Fixture and Support Ownership

- Prefer a checked-in fixture over README commands or helper scripts that synthesize static, deterministic input state.
- Keep scenario-owned fixture files and named input directories directly beside that scenario's README. Do not add a generic scenario-local `fixtures/` wrapper merely to label them as fixtures.
- Hoist a fixture to root `fixtures/` only when two or more live scenarios already share the same fixture contract. Do not hoist based on hypothetical reuse.
- Reuse a repository-owned product asset directly when that real asset is the intended test input. Do not duplicate it as an example-only fixture solely to satisfy directory symmetry.
- Keep scenario-specific helper code beside its scenario. Hoist a helper to root `scripts/` only when multiple scenarios share it or it owns substantial reusable semantic parsing or process coordination.
- Avoid generic `examples/fixtures` or `examples/support` directories when immediate children of `examples/` are treated as scenario identities by CI. Put proven shared resources at the repository root instead.
- Keep fixture trees deterministic and credential-free. Do not commit generated state, sessions, caches, runtime config, machine-specific paths, or secrets.

Use this decision order for setup state:

1. Check in static repository-owned input as a fixture.
2. Use the real public product command when registration, onboarding, migration, or mutation behavior is part of the supported contract.
3. Generate state at runtime only when it contains secrets, runtime-derived paths or identifiers, intentionally varying data, or output that cannot be represented truthfully as static input.

Fixtures prepare inputs; they should not bypass the public surface being tested. Conversely, do not add a seed command or fixture-builder utility merely to recreate the same constant files on every run.

## Leia Block Contract

- Put executable steps in fenced code blocks beneath Leia-recognized sections.
- Start every test with one lowercase `# should ...` line.
- Keep one observable behavior per `# should ...` block.
- Put the commands immediately below the `# should ...` line with no blank line inside the block.
- Separate tests with one blank line. Do not leave commands after a blank line without a new `# should ...` header.
- Treat every blank-line-separated block as a new shell script. Variables, functions, shell options, and working-directory changes do not persist across blocks.
- Prefer one command per line. Avoid `command && next-command` when the selected shell's fail-fast mode makes ordinary newline sequencing equivalent; retain conditional chaining when it is the behavior being expressed.
- Preserve exact casing only for literals and conventional identifiers such as commands, flags, paths, environment variables, formats, product names, acronyms, HTTP methods, status codes, and expected output.
- Split a block when it mixes unrelated contracts, needs `and` or `or` to describe its purpose, or grows beyond roughly 12 to 15 command lines without being one coherent multiline command.

## Assertions and Output

- Assert observable user-facing behavior rather than internal implementation details.
- Prefer filesystem state, installed tools, service status, permissions, generated config, exit status, protocol results, and existing lifecycle logs over assertions about internal argument assembly.
- For one invocation with one output assertion, prefer a direct pipeline:

  ```bash
  # should report the selected mode
  my-cli inspect | grep -F "mode" | grep -F "safe"
  ```

- Chain fixed-string greps when stable tokens must occur on the same line. Do not assert terminal padding, alignment whitespace, color escape sequences, or complete human prose unless those are explicitly stable contracts.
- Grep a product-generated log directly when that log is the observable lifecycle, audit, or safety record.
- Keep product behavior assertions and scenario-specific expected values visible in the owning README or fixture; do not hide them in shared helpers.
- Do not redirect command output to a temporary file solely so the next command can grep it.
- Capture output once when:

  - one required or stateful invocation supports multiple assertions;
  - rerunning it may produce a different result;
  - a complete failure output or secret non-leak check is required;
  - background-process output must be inspected later;
  - the output artifact itself is the contract.

- Use `tee` when captured output should remain visible in CI diagnostics. Otherwise use the simplest truthful redirection.
- Prefer semantic tokens in diagnostic and human-readable output. Reserve exact full-value assertions for stable protocol, config, version, safety, and machine-readable contracts.
- If a command can run only once, capture it and reuse the output rather than weakening the assertions or invoking it again.

## Helpers

- Use shell-native `test`, `cmp`, `grep -F`, command substitution, and exit-status checks for straightforward assertions and scenario-local process coordination. Use JavaScript only when structured semantics, portability, or coordination complexity would be materially worse in shell.
- Do not add preflight existence checks when the immediately following product command validates the same prerequisite clearly. Retain them when the state itself is under test or the check materially improves failure diagnostics.
- Do not introduce generic wrappers such as `assert-line`, `wait-line`, or fixture-builder commands when ordinary shell clearly expresses the contract.
- A semantic checker is justified for structured JSON or JSONL, multi-record correlation, redaction and non-leak rules, bounded diagnostic summaries, or another contract that would become brittle or unreadable in shell.
- A process helper is justified for readiness polling, bounded shutdown, child-process failure detection, or cross-platform coordination that shell cannot express reliably.
- Prefer one shared helper with explicit actions over several tiny utilities when the actions share parsing or process machinery.
- Unit-test the pure parsing and decision logic behind reusable helpers. Do not unit-test thin shell composition or re-test third-party CLI behavior.
- Keep helpers diagnostic on failure: preserve the newest bounded log output and identify whether timeout, early process exit, malformed data, or semantic mismatch caused the failure.

## Runtime State and Process Lifecycles

- Store runtime-derived paths, process IDs, snapshots, and stateful command results under the scenario's `TMPDIR` when later Leia blocks need them.
- Do not treat those runtime artifacts as fixtures; they are evidence produced by the flow.
- When product behavior mutates a checked-in input tree, copy it under the scenario's `TMPDIR` first and run against the copy; keep the checked-in source deterministic.
- Prefer readiness polling against a meaningful product signal over fixed sleeps.
- Bound every readiness and shutdown wait. Allow enough time for cold CI startup and report the relevant process or log state when the bound expires.
- Keep long waits in operational scenarios rather than unit tests. Unit tests should inject deterministic time and process boundaries.
- A deliberate edit used to exercise watching, rebuilding, or restart behavior is an action under test, not static fixture generation.

## Real Product Execution

- Run the real public entrypoint when CI can do so safely. Do not substitute fake bootstrap scripts, private config writes, synthetic tool success, or local stubs for the supported product flow.
- When a public registration or onboarding command is part of the integration contract, use it even if a static config could be written more cheaply.
- When the distributed artifact is the product, prepare and test the release-shaped artifact rather than a source-only entrypoint.
- Test the runtime mode the product actually supports. Do not enable unrelated container, VM, sandbox, daemon, channel, or service behavior merely because the dependency offers it.
- If the safe default target is manageable to clean up, testing that default target directly is acceptable instead of forcing an example-local override.
- Keep secrets in CI-managed environment variables. A scenario that requires a secret must fail clearly when it is absent and must assert that owned output and logs do not expose it.

## Model-Backed Scenarios

- Do not invoke a live AI model when model execution is not part of the contract and static configuration, fixtures, or deterministic assertions can truthfully prove the behavior.
- When a live model is required and exact model identity or model quality is not under test, use the lowest-cost, generally available, non-specialized model that supports the required provider and capabilities.
- Use a larger, specialized, or exact model only when the scenario explicitly tests that model or a capability the lower-cost default cannot provide. State that reason in the scenario.
- Keep model selection configurable through one repository-level CI environment variable with one declared default. Do not repeat model identifiers across workflows, README files, and helpers.
- Minimize model invocations, input and output tokens, and retries while preserving the contract. Do not retry nondeterministic output merely to obtain a preferred response.
- Scope model credentials and model-specific environment to the model-backed scenario or matrix entry. Other scenarios must not receive them.
- Review the repository default when model availability or pricing changes. Do not encode a current provider model identifier in shared Canon guidance.

## Generator Safety

Leia may embed parsed command text inside a JavaScript template literal while generating its harness. Within executable Leia blocks:

- Do not use literal backticks. Use `$(command)` for command substitution.
- Do not use braced shell expansions such as `${VAR}`. Use `$VAR`, or quote it as `"$VAR"suffix` when text follows.
- Do not use numeric backreferences `\0` through `\9`. JavaScript consumes or rejects those escapes before the shell receives them; rewrite the command without numeric backreferences or move it into a checked-in helper.
- Move shell logic that genuinely requires braced parameter expansion into a checked-in helper and call that helper from the README.
- Do not rely on escaping content through both JavaScript-template and shell layers.

Markdown fence markers, inline-code backticks outside executable blocks, `$(...)`, `$VAR`, `[ ... ]`, and `[[ ... ]]` remain safe.

## JavaScript Package Boundary

- Treat Leia's generated `.js` harness as CommonJS when the supported Leia version emits `require`.
- In an ESM repository, commit an `examples/package.json` with `{ "type": "commonjs" }` whenever Leia writes its generated harness beneath `examples/` or another directory governed by the root ESM package.
- Put the boundary at or above the generated harness and below the governing ESM package.
- Do not add this boundary when the harness is outside the ESM package scope or already inherits a nearer CommonJS boundary.
- Use the shared `templates/leia-examples-package.json` starter when the standard examples-level boundary applies.
- Treat this as compatibility scaffolding and remove it only after the supported Leia version is verified to emit an ESM-compatible harness.

## CI Guidance

- Run mutating, secret-backed, or platform-dependent Leia scenarios on fresh CI runners by default.
- Map one matrix entry to one example so failures identify the broken user flow directly.
- Keep matrix names aligned with scenario directory names.
- Prepare dependencies and the release-shaped product once per job, then invoke one scenario README.
- A shared workflow may expose non-secret common environment to every matrix entry, but secrets and model-specific values must be scoped to the scenarios that own them.
- Prefer a repo-local `TMPDIR` when runner temp behavior or sandboxing is unreliable. Ignore its generated contents and commit any required package boundary rather than generating repository contract files in CI.
- Do not add cleanup solely to erase runner-owned state on an ephemeral job.
- Do not run machine-mutating scenarios locally unless the user explicitly requests operational validation.

## Review Checklist

- Does the README cover one user-visible flow?
- Is every constant input checked in beside its sole owning scenario or hoisted only after proven sharing?
- Are public product commands retained where their behavior is part of the contract?
- Are generated files limited to runtime-derived state and evidence?
- Are behavior assertions and scenario-specific expected values visible in the README or fixture rather than a shared helper?
- Are checked-in inputs copied under `TMPDIR` before product behavior mutates them?
- Are simple assertions direct and semantic rather than whitespace-sensitive?
- Is captured output reused for a real reason?
- Are existing product logs inspected directly instead of duplicated?
- Is every helper justified by structured semantics, process coordination, or proven reuse?
- Are waits bounded, readiness-based, and diagnostic on failure?
- Does CI run the prepared product artifact in its intended runtime mode?
- Are secrets required explicitly and protected from output?
- Is each live model invocation required by the contract and using the lowest-cost compatible model?
- Are model selection and credentials centralized and scoped to model-backed scenarios?
- Is cleanup present only when resources can persist or cleanup behavior is itself under test?
- Are pure helper decisions covered by unit tests and operational behavior left to Leia?
