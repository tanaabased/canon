---
name: tanaab-skill-validator
description: Tanaab-based validation of canon skills against the shared skill standard. Use when a user wants to validate a skill directory or review canon-skill errors, warnings, and manual checks.
license: MIT
metadata:
  type: meta
  owner: tanaab
  tags:
    - tanaab
    - meta
    - skills
    - validation
---

# Skill Validator

## Overview

Use this skill when the task is validating a canon skill rather than creating or rewriting one.

- Validate against the shared contract in [`../../references/skill-standard.md`](../../references/skill-standard.md).
- Validate section order against [`../../references/skill-types.md`](../../references/skill-types.md).
- Validate category tags against [`../../references/skill-tags.md`](../../references/skill-tags.md).
- Validate that Tanaab description fields use the `Tanaab-based` prefix where required.
- Validate that `agents/openai.yaml` icon fields exist and resolve to local assets.
- Use [`../../scripts/skill-validate-cli.js`](../../scripts/skill-validate-cli.js) for the objective checks.
- Treat `[error]` results as blocking.
- Treat `[warn]` and `[manual]` results as design review input, not silent success.

## When to Use

- Validate a newly created skill.
- Validate a standardized or migrated skill.
- Check whether a skill still matches the current shared canon contract.
- Review warnings and manual checks before finalizing a skill change.

## When Not to Use

- Do not use this skill to design a new skill from scratch. Use [../tanaab-skill-creator/SKILL.md](../tanaab-skill-creator/SKILL.md) for that surface.
- Do not use this skill for whole-stack audit or keep/merge/delete planning across many old skills.

## Evaluation Criteria

- Check that the selected type is valid and the section order matches it exactly.
- Check that metadata and `metadata.tags` are internally consistent.
- Keep blocking failures tied to the shared contract, not to personal style preferences.

## Anti-Patterns

- Do not treat warnings as hard failures without evidence.
- Do not validate against stale local conventions when the shared canon changed.
- Do not ignore typed section order drift just because the headings are close.

## Iteration Loop

- Run the validator first for objective failures.
- Fix every `[error]`, then review `[warn]` and `[manual]`.
- Re-run validation after each structural change.

## Workflow

1. Identify the target skill.

2. Load shared contract material only if the result needs interpretation.

- Read [`../../references/skill-standard.md`](../../references/skill-standard.md) for the contract.
- Read [`../../references/skill-types.md`](../../references/skill-types.md) or [`../../references/skill-tags.md`](../../references/skill-tags.md) only when the failure depends on type or tag rules.

3. Run validation.

- Use [`../../scripts/skill-validate-cli.js`](../../scripts/skill-validate-cli.js) with `--skill-dir`.
- Pass `--type` only when the expected type should be asserted explicitly.

4. Interpret the result.

- Fix every `[error]`.
- Review `[warn]` items and either fix them or explain why they are acceptable.
- Surface `[manual]` items explicitly instead of pretending they were resolved.

## Bundled Resources

- [../../references/skill-standard.md](../../references/skill-standard.md): shared source of truth for canon skill validation
- [../../references/skill-types.md](../../references/skill-types.md): exact section orders for each supported type
- [../../references/skill-tags.md](../../references/skill-tags.md): canonical category-tag list
- [../../scripts/skill-validate-cli.js](../../scripts/skill-validate-cli.js): validation entrypoint for skill directories

## Validation

- Run `skill-validate-cli.js` against the target skill.
- Confirm the result has no `[error]` items.
- Report warnings and manual checks clearly in the final output.
