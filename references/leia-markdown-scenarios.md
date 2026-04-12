# Leia Markdown Scenarios

Use this pattern when shell, bootstrap, or other operational repos need scenario coverage that is easier to express as executable shell steps than as unit tests.

## When to Use

- The main risk is end-to-end behavior, machine mutation, CLI contract, file layout, permissions, or log output.
- The repo already explains supported flows through example directories and those examples can double as runnable coverage.
- The suite may need fresh runners, secrets, or destructive setup and cleanup that do not fit a normal local `bun run test` path.

## Example Shape

- Put each scenario in its own example directory.
- Keep the scenario contract in `examples/<scenario>/README.md`.
- Use the README as both scenario documentation and executable test coverage.
- Keep fixtures beside the README so each example stays self-contained.
- Prefer broad contract names such as `options`, `envvars`, or `cli-contract` unless the scenario is truly about one narrow case.

## README Structure

Recommended sections:

1. Title and one-paragraph summary of the scenario
2. `## Setup`
3. `## Testing`
4. `## Destroy tests`

## Scenario Rules

- Keep one scenario per README instead of combining many unrelated flows.
- Use example-local scratch paths such as `.tmp/` so setup and cleanup stay scoped, but prefer additive prep like `mkdir -p` over clearing shared example-local temp roots by default.
- Prefer shell-native assertions against observable behavior such as installed files, symlinks, permissions, derived key material, exit status, real target directories, and installed tools.
- Assert the user-facing contract, not internal implementation details.
- Prefer real script execution over fake `curl` or bootstrap stubs when the scenario is meant to validate runtime behavior and CI can safely exercise the real product surface.
- Do not add local stubs just to avoid running the actual prepared script when the runner can execute the real contract safely.
- Keep `Setup` focused on minimal prerequisites for the scenario.
- For broad runtime scenarios such as `options` or `envvars`, use the final `Setup` test to run the real script once with the relevant options or environment, then inspect the resulting machine state in `Testing`.
- For CLI-contract scenarios, keep assertions direct and lightweight: `script --help | grep ...`, `test -n "$(script --version)"`, or inline status-code checks.
- Capture output to files only when direct inspection would be awkward or when a failure-path assertion needs the full output.
- Use setup log files only when log output itself is part of the contract.
- If the safe default target is manageable to clean up, testing that default target directly is acceptable instead of forcing an example-local override.
- For precedence behavior, test the simplest observable contract first, such as help or default display, and only expand to a full runtime scenario when that behavior is not sufficient.
- Use fenced code blocks for executable Leia steps. The language tag is optional, but unfenced shell snippets are not valid Leia scenario input.
- Start each Leia test with a single `# should ...` line so the scenario still reads like documentation.
- Put the commands for that test immediately below its `# should ...` line with no blank lines inside the test body.
- Separate one `# should ...` test from the next with a blank line.
- Do not place another `# should ...` line directly after commands without a separating blank line.
- Do not leave stray commands after a blank line without a new `# should ...` header.
- Always include cleanup in `Destroy tests`, even when CI runners are ephemeral, and remove only the artifacts created by that scenario.

## CI Guidance

- Prefer real CI execution over local stubs when fresh runners can safely exercise the actual product surface.
- Prefer fresh-runner CI execution when the scenario mutates machine state, installs packages, or needs secrets.
- Do not run machine-mutating Leia scenarios locally by default; reserve local Leia execution for explicit user requests or clearly non-mutating suites.
- Matrix one workflow job per example when failures should identify the exact broken scenario quickly.
- When the distributed artifact is the real product surface, run Leia against the prepared `dist/` entrypoint rather than the raw source file.
- When a Bun CLI ships as a built or compiled artifact, run Leia against that built CLI rather than `bun run` or a source-tree entrypoint.
- Prefer a repo-local `TMPDIR` for Leia runs when sandbox or runner temp behavior is unreliable.

## Boundaries

- Use Mocha or other unit tests for pure parsing, transformation, or helper logic.
- Use Leia scenarios for observable operational flows that would be awkward, misleading, or brittle as unit tests.
