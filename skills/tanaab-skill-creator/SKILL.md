---
name: tanaab-skill-creator
description: Tanaab-based creation or standardization of canon skills from the shared base template and typed section partials. Use when a user wants to scaffold a new repo-local skill, choose or change a skill type, or standardize an existing skill to the current typed template model.
type: meta
owner: tanaab
tags:
  - tanaab
  - meta
  - skills
---

# Skill Creator

## Overview

Use this skill when the skill itself is the artifact being created, standardized, or extracted.

- Variable identity input is `type`.
- `owner` is fixed to `tanaab` for live canon skills in this repo.
- `type` chooses the typed section model. Current type ids are `generic`, `coding`, `integration`, `workflow`, and `meta`.
- Keep `generic` as the escape hatch, not the default when a narrower type clearly fits.
- Tanaab skill descriptions should start with `Tanaab-based` in both `SKILL.md` frontmatter and `agents/openai.yaml` short descriptions.
- New Tanaab skills should scaffold the shared generic icon assets into their local `assets/` folder and point `agents/openai.yaml` at them.
- `tags` should include `tanaab`, the selected `type`, and a small category tag chosen from [`../../references/skill-tags.md`](../../references/skill-tags.md).
- Use this repo-local skill to apply the canon repo's concrete template and owner contract.
- Do not depend on environment-specific upstream skill-creation helpers.
- Keep the skill narrow and task-owned.
- Keep shared canon at repo root instead of burying it inside one skill.
- Keep skill-local `scripts/`, `references/`, `templates/`, or extra `assets/` only when they are unique to that skill.

Load only what the task needs:

- [../../references/skill-standard.md](../../references/skill-standard.md) for naming, structure, owner, and standardization rules
- [../../references/skill-types.md](../../references/skill-types.md) for the valid type ids, section orders, and type meanings
- [../../references/skill-tags.md](../../references/skill-tags.md) for the canon tag list and category guidance
- [../../templates/skill-generic-skill.md](../../templates/skill-generic-skill.md) for the shared base template
- [../../templates/tanaab-skill-icon-small.svg](../../templates/tanaab-skill-icon-small.svg) for the shared small skill icon
- [../../templates/tanaab-skill-icon-large.png](../../templates/tanaab-skill-icon-large.png) for the shared large skill icon

Use repo helpers when they fit:

- [../../scripts/init-skill.js](../../scripts/init-skill.js) to scaffold a skill from the base template and a type partial
- [../../scripts/validate-skill.js](../../scripts/validate-skill.js) to validate the resulting skill against the shared standard

## When to Use

- Create a new skill from scratch.
- Choose or refine a skill's `type`.
- Standardize an existing skill's `SKILL.md`, `agents/openai.yaml`, naming, or owner metadata.
- Move shared skill support material into repo-root `references/`, `guidance/`, `prompts/`, `templates/`, or `scripts/`.
- Split a broad skill into narrower skills with clearer owned surfaces.

## When Not to Use

- Do not use this skill for ordinary work that merely happens inside an existing skill.
- Do not use this skill for validation-only passes. Use [../tanaab-skill-validator/SKILL.md](../tanaab-skill-validator/SKILL.md) for that surface.
- Do not use this skill for whole-stack audit, keep/merge/delete planning, or router cleanup unless the task is specifically about creation or standardization mechanics.
- Do not leave shared standards, owner rules, or helper scripts trapped inside one skill when they clearly belong at repo root.

## Evaluation Criteria

- Use the smallest type that clearly fits the skill's owned surface.
- Keep the section shape aligned with [`../../references/skill-types.md`](../../references/skill-types.md).
- Keep metadata, tags, naming, and Tanaab owner rules consistent with the shared canon contract.

## Anti-Patterns

- Do not treat type selection as runtime routing.
- Do not create a separate full template when a type partial will do.
- Do not use `generic` as the default when a narrower type clearly fits.
- Do not reintroduce per-skill owner overlays or icon selection logic into live canon skill creation.

## Iteration Loop

- Start from the shared base template and the smallest matching type partial.
- Validate the result, then tighten scope before adding more canon or sections.
- Promote new type shapes only after repeated pressure shows the current ones are insufficient.

## Workflow

1. Determine the mode and identity inputs.

- Ask only for missing inputs that change identity or behavior.
- Determine `type` first. Default to `generic`.
- Read [`../../references/skill-types.md`](../../references/skill-types.md) and choose the narrowest matching type.
- Derive `tags` from `tanaab`, the selected `type`, and one category tag. Let `init-skill.js` infer the category tag unless the task clearly needs an override.
- If standardizing, inventory the current skill first.

2. Load shared canon selectively.

- Read `skill-standard.md` for file shape, naming, owner, and metadata rules.
- Read `skill-types.md` for the allowed types and the selected section order.
- Read `skill-tags.md` when you need to choose or review the category tag.
- Read the shared base template and the selected type section partial.

3. Scaffold or standardize from the selected type.

- Prefer repo-root canon for shared rules, templates, and helper scripts.
- Keep the shared base template stable and let type-specific sections carry the typed shape.
- Keep local bundled resources only when they are unique to this skill and have no human-accessible value at repo root.
- If a skill seems to need a heavy relationship section, split the skill instead of documenting the overlap.
- Use `init-skill.js` when it fits the requested scaffold. Patch manually when the task is a partial migration or standardization pass.

4. Keep the result minimal.

- Do not widen scope with dormant asset or owner-overlay workflows.
- Do not widen the initializer into a type engine before multiple concrete types demand it.

5. Validate before finishing.

- Run `validate-skill.js` against the generated or updated skill.
- Check that `SKILL.md` links resolve and the skill only references canon it actually needs.
- Confirm the selected template and type actually match the generated machine id and metadata.
- Confirm the selected type's top-level section order matches [`../../references/skill-types.md`](../../references/skill-types.md).
- Confirm frontmatter `type`, `owner`, `description`, and `tags` match the intended scaffold inputs.
- Confirm `agents/openai.yaml` points at the scaffolded icon assets and the files exist.

## Bundled Resources

- [../../references/skill-standard.md](../../references/skill-standard.md): naming, structure, owner, and standardization rules
- [../../references/skill-types.md](../../references/skill-types.md): valid type ids and exact section orders
- [../../references/skill-tags.md](../../references/skill-tags.md): canonical category-tag list
- [../../templates/skill-generic-skill.md](../../templates/skill-generic-skill.md): shared base template for all first-block types
- [../../templates/tanaab-skill-icon-small.svg](../../templates/tanaab-skill-icon-small.svg): shared generic small Tanaab skill icon
- [../../templates/tanaab-skill-icon-large.png](../../templates/tanaab-skill-icon-large.png): shared generic large Tanaab skill icon
- [../../scripts/init-skill.js](../../scripts/init-skill.js): deterministic base-plus-type scaffolder with the fixed Tanaab owner contract
- [../../scripts/validate-skill.js](../../scripts/validate-skill.js): shared validator for objective skill-standard checks

## Validation

- Confirm the new or updated skill has a distinct owned surface.
- Confirm the selected `type` is explicit and correct.
- Confirm the selected type order and inserted type sections are correct.
- Confirm shared canon now lives at repo root when it is reused across skills.
- Run `validate-skill.js` and fix all `[error]` results before finishing.
- Confirm `agents/openai.yaml` still matches the skill's actual scope and the shared Tanaab metadata rules.
