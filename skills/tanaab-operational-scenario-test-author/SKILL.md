---
name: tanaab-operational-scenario-test-author
description: Tanaab-based authoring and standardization of executable operational scenario tests. Use when a user wants Leia-backed README scenarios, CI-first destructive test coverage, or release-shaped operational smoke coverage for shell, bootstrap, or hosted-script repos.
license: MIT
metadata:
  type: workflow
  owner: tanaab
  tags:
    - tanaab
    - workflow
    - testing
---

# Operational Scenario Test Author

## Overview

Tanaab-based authoring and standardization of executable operational scenario tests. Use when a user wants Leia-backed README scenarios, CI-first destructive test coverage, or release-shaped operational smoke coverage for shell, bootstrap, or hosted-script repos.

## When to Use

- Add or standardize Leia-backed executable scenario coverage in `examples/<scenario>/README.md`.
- Shape CI-first destructive or machine-mutating operational coverage for shell, bootstrap, or hosted-script repos.
- Apply the local Leia example starter when a repo needs one scenario per README with `Setup`, `Testing`, and `Destroy tests`.
- Keep operational smoke coverage aligned with the real shipped surface when `dist/` is what users actually run.

## When Not to Use

- Do not use this skill for pure parsing, transformation, or helper logic that belongs in ordinary unit tests.
- Do not use this skill for GitHub Actions workflow topology once the main owned surface is the workflow graph rather than the scenario contract.
- Do not run machine-mutating Leia suites locally by default unless the user explicitly asks for that.

## Preconditions

- Confirm whether the scenario is safe for local execution or should remain CI-first.
- Confirm the real product surface being tested: source script, prepared `dist/` artifact, or another user-facing entrypoint.

## Workflow

1. Confirm the request is specifically about executable operational scenarios rather than unit tests.
2. Load the local Leia conventions and starter, then scope the scenario to one observable user flow.
3. Keep setup, assertions, and cleanup explicit in the README contract and avoid hiding the flow in helper prose.
4. Validate the scenario shape and execution boundary, and surface local-vs-CI limits explicitly.

## Checkpoints

- Pause before any local run that mutates machine state, installs packages, touches user configuration, or needs secrets.
- Split unrelated flows into separate example READMEs instead of broadening one scenario.

## Completion Criteria

- Define the final example README shape, the observable assertions, and the intended execution boundary.
- Make any required CI workflow follow-up explicit if the scenario needs fresh-runner coverage.

## Bundled Resources

- [./references/leia-markdown-scenarios.md](./references/leia-markdown-scenarios.md): local rules for Leia-backed scenario docs and CI-first execution
- [./templates/leia-markdown-example/README.md](./templates/leia-markdown-example/README.md): starter README for one executable scenario
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): default boundary between unit tests and operational scenario tests

## Validation

- Confirm the task stayed on Leia-backed operational scenario coverage rather than drifting into ordinary unit tests or workflow topology.
- Confirm the README uses fenced code blocks, one `# should ...` header per test, and blank lines only between tests.
- Confirm cleanup is explicit and scoped to example-local scratch paths.
- Confirm machine-mutating suites were not run locally unless the user explicitly requested that.
