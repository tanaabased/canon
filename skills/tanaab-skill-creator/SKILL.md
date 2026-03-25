---
name: tanaab-skill-creator
description: Tanaab-based creation or standardization of canon skills. Use when a user wants to scaffold a new repo-local skill, change a skill type, or standardize an existing skill to the current canon contract.
license: MIT
metadata:
  type: meta
  owner: tanaab
  tags:
    - tanaab
    - meta
    - skills
---

# Skill Creator

## Overview

Use this skill when the skill itself is the artifact being created or standardized.

- `type` is the only variable identity input.
- Choose the narrowest type that fits; keep `generic` as the fallback.
- Let shared references define the contract and let the CLIs handle deterministic scaffolding and validation.
- Keep the skill narrow and hoist reused canon to repo root instead of trapping it inside one skill.

## When to Use

- Create a new skill from scratch.
- Choose or refine a skill's `type`.
- Standardize an existing skill's `SKILL.md`, `agents/openai.yaml`, naming, or `metadata.owner`.
- Move shared skill support material into repo-root `references/`, `guidance/`, `prompts/`, `templates/`, or `scripts/`.
- Split a broad skill into narrower skills with clearer owned surfaces.

## When Not to Use

- Do not use this skill for ordinary work that merely happens inside an existing skill.
- Do not use this skill for validation-only passes. Use [../tanaab-skill-validator/SKILL.md](../tanaab-skill-validator/SKILL.md) for that surface.
- Do not use this skill for whole-stack audit, keep/merge/delete planning, or router cleanup unless the task is specifically about creation or standardization mechanics.
- Do not treat shared references or helper CLIs as optional when they already cover the requested change.

## Evaluation Criteria

- Use the smallest type that clearly fits the skill's owned surface.
- Keep structure and metadata aligned with the shared canon contract.
- Keep shared canon at repo root when the material is reused across skills.

## Anti-Patterns

- Do not treat type selection as runtime routing.
- Do not create a separate full template when a type partial will do.
- Do not use `generic` as the default when a narrower type clearly fits.
- Do not duplicate contract rules in skill prose when the standard or CLI already enforces them.

## Iteration Loop

- Start with the smallest fitting type.
- Scaffold or patch the skill, then validate immediately.
- Tighten scope before adding new sections, resources, or canon.

## Workflow

1. Determine whether the task is create vs standardize and choose `type`.

2. Load only the needed shared references.

- Read [`../../references/skill-standard.md`](../../references/skill-standard.md) for the contract.
- Read [`../../references/skill-types.md`](../../references/skill-types.md) for type shape and section order.
- Read [`../../references/skill-tags.md`](../../references/skill-tags.md) only when tag choice needs review.

3. Scaffold or patch the skill.

- Use [`../../scripts/skill-init-cli.js`](../../scripts/skill-init-cli.js) when the task is a clean scaffold.
- Patch manually when the task is a partial migration or standardization pass.

4. Validate before finishing.

- Run [`../../scripts/skill-validate-cli.js`](../../scripts/skill-validate-cli.js) against the generated or updated skill.
- Fix every `[error]` before finishing.
- Confirm the skill still owns one narrow surface and only references canon it actually needs.

## Bundled Resources

- [../../references/skill-standard.md](../../references/skill-standard.md): naming, structure, metadata, and validation contract
- [../../references/skill-types.md](../../references/skill-types.md): valid type ids and exact section orders
- [../../references/skill-tags.md](../../references/skill-tags.md): canonical category-tag list
- [../../scripts/skill-init-cli.js](../../scripts/skill-init-cli.js): deterministic base-plus-type scaffolder with the fixed Tanaab owner contract
- [../../scripts/skill-validate-cli.js](../../scripts/skill-validate-cli.js): shared validator for objective skill-standard checks

## Validation

- Confirm the new or updated skill has a distinct owned surface.
- Confirm the selected `type` is explicit and correct.
- Confirm the selected type order is correct.
- Confirm shared canon now lives at repo root when it is reused across skills.
- Run `skill-validate-cli.js` and fix all `[error]` results before finishing.
