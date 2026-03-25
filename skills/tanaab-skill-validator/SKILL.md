---
name: tanaab-skill-validator
description: Tanaab-based validation of canon skills against the shared skill standard. Use when a user wants to check a skill directory, confirm a new or standardized skill passes objective structure rules, or review warnings and manual checks for canon skill quality.
type: meta
owner: tanaab
tags:
  - tanaab
  - meta
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
- Use [`../../scripts/validate-skill.js`](../../scripts/validate-skill.js) for the objective checks.
- Treat `[error]` results as blocking.
- Treat `[warn]` results as design feedback.
- Treat `[manual]` results as review prompts for a human or the active agent.

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
- Check that metadata and tags are internally consistent.
- Check that validation errors are objective contract failures, not style preferences dressed up as blockers.

## Anti-Patterns

- Do not treat warnings as hard failures without evidence.
- Do not validate against stale local conventions when the shared canon changed.
- Do not ignore typed section order drift just because the headings are semantically similar.

## Iteration Loop

- Run the validator first for objective failures.
- Fix every `[error]`, then review `[warn]` and `[manual]` items.
- Re-run validation after each structural change instead of batching blind edits.

## Workflow

1. Determine the validation target.

- Get the skill directory path.
- Get the expected `type` when you need to assert a specific type. Otherwise let the validator read it from frontmatter.

2. Load the shared validation surface.

- Read [`../../references/skill-standard.md`](../../references/skill-standard.md) for the current contract.
- Read [`../../references/skill-types.md`](../../references/skill-types.md) for the selected type order and valid type ids.
- Read [`../../references/skill-tags.md`](../../references/skill-tags.md) when tag selection or category validity is part of the review.
- Use [`../../scripts/validate-skill.js`](../../scripts/validate-skill.js) for the objective checks.

3. Run validation.

- Pass `--skill-dir`.
- Pass `--type` only when you want to assert the expected type explicitly.

4. Interpret the result.

- Fix every `[error]`.
- Review `[warn]` items and either fix them or explain why they are acceptable.
- Surface `[manual]` items explicitly instead of pretending they were automatically resolved.

## Bundled Resources

- [../../references/skill-standard.md](../../references/skill-standard.md): shared source of truth for canon skill validation
- [../../references/skill-types.md](../../references/skill-types.md): exact section orders for each supported type
- [../../references/skill-tags.md](../../references/skill-tags.md): canonical category-tag list
- [../../scripts/validate-skill.js](../../scripts/validate-skill.js): validation entrypoint for skill directories

## Validation

- Run `validate-skill.js` against the target skill.
- Confirm the result has no `[error]` items.
- Report warnings and manual checks clearly in the final output.
