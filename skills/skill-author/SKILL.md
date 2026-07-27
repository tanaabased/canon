---
name: tanaab-skill-author
description: Tanaab-based authoring, standardization, and validation of canon skills. Use when a user wants to scaffold a new repo-local skill, standardize an existing skill, or validate a canon skill directory against the current contract.
license: MIT
metadata:
  type: meta
  owner: tanaab
  tags:
    - tanaab
    - meta
    - skills
  openclaw:
    emoji: '🛠️'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/skill-author
    requires:
      bins:
        - bun
---

# Skill Author

## Overview

Use this skill when the skill itself is the artifact being created, standardized, or validated.

- `type` is the only variable identity input for new or standardized skills.
- Choose the narrowest type that fits; keep `generic` as the fallback.
- Validation is a first-class workflow phase and a valid standalone mode.
- Treat a workflow facet as a reusable path through one owned surface; keep domain-appropriate mode, lifecycle, and variant language instead of forcing one label onto every skill.
- Retain and tailor the optional `Optimization` facet when the skill can audit an existing persistent surface against durable canon; remove it for incident-specific, event-specific, or execution-only workflows.
- Let the shared standard define the base contract and let local templates and scripts own type-specific authoring behavior.
- Keep support material local unless it clearly passes the hoist test for repo-root canon, and apply that same ownership test to skill-local tests.
- For `coding` skills, define one owned code surface plus three lifecycle sections: `Documentation`, `Testing`, and `GitHub Actions Workflow`.
- In plugin-contained skill trees, keep the owner-prefixed machine id in frontmatter and prompts while omitting that owner prefix from the skill folder name.
- Give every skill a skill-specific `metadata.openclaw.emoji` and an HTTPS source homepage; add load-time gates only for hard runtime dependencies.
- If the reusable artifact is really a whole starter repository with committed structure, scripts, examples, and docs that users adopt wholesale, challenge whether it should be a repo template instead of a live skill.
- When a skill implies durable, always-on repo policy, it may bundle `references/repo-agents-lines.md` as short copyable guidance for a target repo's `AGENTS.md`.

## When to Use

- Create a new skill from scratch.
- Choose or refine a skill's `type`.
- Standardize an existing skill's `SKILL.md`, `agents/openai.yaml`, naming, `metadata.owner`, or `metadata.openclaw`.
- Validate a newly created, standardized, or migrated skill directory.
- Review whether skill support material and tests should stay local or be hoisted under the shared hoist test.
- Split a broad skill into narrower skills with clearer owned surfaces.
- Review whether a proposed skill surface is better expressed as a repo template than as a live skill.
- Review whether a skill should bundle short repo `AGENTS.md` lines because its surface implies durable ambient repo policy.
- Decide whether a new or standardized skill should retain and tailor the full template's optional `Optimization` facet.

## When Not to Use

- Do not use this skill for ordinary work that merely happens inside an existing skill.
- Do not use this skill for whole-stack audit, keep/merge/delete planning, or router cleanup unless the task is specifically about creation or standardization mechanics.
- Do not treat shared references or helper CLIs as optional when they already cover the requested change.
- Do not force a live skill when the real reusable artifact is a whole starter repo that users should adopt directly.

## Evaluation Criteria

- Use the smallest type that clearly fits the skill's owned surface.
- Keep structure and metadata aligned with the shared canon contract.
- Keep OpenClaw display metadata in `SKILL.md` and Codex interface metadata in `agents/openai.yaml`.
- Keep validation results tied to the shared contract and canonical local templates rather than personal preference.
- Keep material local by default and hoist only on proven reuse, repo-wide contract status, or standalone human value.
- For `coding` skills, allow broad discovery language only when it still funnels into one dominant implementation pattern.
- Prefer a repo template when the reusable contract is a committed starter repository with structure, scripts, examples, and docs that users adopt as a whole; keep a live skill only for cross-repo decision-making that remains after the template choice.
- Bundle repo `AGENTS.md` lines only for durable always-on repo rules, not for conditional workflow steps that belong in the skill itself.
- Keep `Optimization` only when the skill owns persistent alignment, and make its read-only inspection, comparison, recommendation, authorized application, and verification boundaries specific to that surface.

## Anti-Patterns

- Do not treat type selection as runtime routing.
- Do not keep a separate validator skill when validation is only a lifecycle phase of skill authoring.
- Do not use `generic` as the default when a narrower type clearly fits.
- Do not duplicate contract rules in skill prose when the standard or CLI already enforces them.
- Do not hoist a file to repo root just because it might be reused later.
- Do not let a `coding` skill accumulate multiple materially different documentation, testing, or GitHub Actions validation mechanisms unless the variations are minor flavors of one pattern.
- Do not keep a live skill whose main job is to restate one repo template's structure, scripts, examples, and docs.
- Do not use repo `AGENTS.md` guidance as a dumping ground for task-triggered workflow detail.
- Do not require `Optimization` for incident-specific or event-specific skills, and do not leave a generic template section untailored.

## Iteration Loop

- Start with the smallest fitting type.
- Scaffold or patch the skill, then validate immediately.
- Run validation first when the request is validation-only.
- Tighten scope before adding new sections, resources, or hoisted canon.
- For `coding` skills, challenge the scope before adding a second materially different documentation, direct-test, or GitHub Actions workflow pattern.
- Challenge skill-vs-template ownership before adding doctrine for a surface that already looks like a reusable starter repo.
- Review optimization applicability before finalizing a new or standardized skill; retain and tailor the full-template section or remove it deliberately.

## Workflow

1. Determine whether the task is create, standardize, or validate. Choose `type` whenever the task changes or asserts skill identity, and challenge whether the surface is really a live skill or would be better owned by a repo template.

2. Load only the needed shared references.

- Read [`../../references/skill-standard.md`](../../references/skill-standard.md) for the contract.
- Read the matching local template in [`./templates/`](./templates/) when type shape or default metadata needs review.

3. Scaffold or patch the skill.

- Use [`./scripts/init-skill.js`](./scripts/init-skill.js) when the task is a clean scaffold.
- Supply a skill-specific OpenClaw emoji. Let the scaffolder derive the canonical homepage, or provide an explicit homepage for a custom output directory.
- Patch manually when the task is a partial migration or standardization pass.
- Review the scaffolded `Optimization` section. Retain and tailor it when the skill can audit an existing persistent surface against durable canon; otherwise remove it.
- Use [`./scripts/validate-skill.js`](./scripts/validate-skill.js) when the task is validation-only or when structural changes need objective confirmation.
- Keep support material local by default.
- Organize skill-owned JavaScript by role at the skill root: public commands in `bin/`, internal commands in `scripts/`, orchestration in `lib/`, independently testable units in `utils/`, and tests in `test/`.
- Keep skill-owned `test/` directories flat by default, with specs, fixtures, fakes, and support JavaScript as siblings.
- Hoist only when the file is reused across live surfaces, is a repo-wide contract or tooling surface, or has standalone human value.
- Review existing hoisted files with one meaningful live consumer for demotion.

4. Validate before finishing.

- Run [`./scripts/validate-skill.js`](./scripts/validate-skill.js) against the generated or updated skill.
- Fix every `[error]` before finishing.
- Review `[warn]` and `[manual]` results explicitly instead of treating them as silent success.
- Confirm the skill still owns one narrow surface and only references canon it actually needs.

## Optimization

- **Inspect:** Inventory discovery text, scope, type, metadata, section shape, bundled resources, code and test placement, and Optimization applicability.
- **Compare:** Evaluate the skill against the shared standard and its selected type template while preserving one narrow owned surface.
- **Recommend:** Prioritize scope, discovery, ownership, and contract consistency without creating routers, duplicate doctrine, or new validators.
- **Apply:** After explicit authorization, make the smallest contract-aligned change and deliberately retain and tailor or remove the Optimization facet.
- **Verify:** Run the existing validator, review its manual checks, and confirm the skill and its resources still resolve to one clear owner.

## Bundled Resources

- [../../references/skill-standard.md](../../references/skill-standard.md): naming, structure, metadata, and validation contract
- [./templates/meta.md](./templates/meta.md): canonical full-template model for `meta` skills; sibling templates define the other type shapes
- [./scripts/init-skill.js](./scripts/init-skill.js): deterministic scaffolder for canonical full templates
- [./scripts/validate-skill.js](./scripts/validate-skill.js): validation entrypoint for skill directories
- [./lib/skill-contract.js](./lib/skill-contract.js): canonical type, template, naming, and bundled-asset contract
- [./lib/skill-scaffolder.js](./lib/skill-scaffolder.js): deterministic skill creation and post-write validation workflow
- [./lib/skill-validator.js](./lib/skill-validator.js): skill-directory validation orchestration
- [./utils/](./utils/): independently testable frontmatter, description, inference, rendering, naming, and argument units

## Validation

- Confirm the new or updated skill has a distinct owned surface.
- Confirm the selected `type` is explicit and correct.
- Confirm the selected type order is correct.
- Confirm `metadata.openclaw` has a skill-specific emoji and correct HTTPS homepage, with dependency gates only for hard runtime requirements.
- Confirm `coding` skills include `Documentation`, `Testing`, and `GitHub Actions Workflow` as the canonical lifecycle sections.
- Confirm validation-only requests are handled by the same surface rather than a separate validator skill.
- Confirm the surface is not better expressed as a repo template with the skill kept only as a thin discovery or adaptation layer, if needed.
- Confirm any bundled repo `AGENTS.md` lines stay short, ambient, and worth copying into a project repo.
- Confirm bundled resources stay local unless they clearly pass the hoist test.
- Confirm skill-owned test files remain flat beneath the skill's `test/` directory unless an external tool requires a fixed nested path.
- Confirm any repo-root resources still justify being hoisted.
- Confirm `Optimization` is present and surface-specific when persistent alignment is owned, or intentionally omitted for incident-specific, event-specific, or execution-only workflows.
- Run `validate-skill.js` and fix all `[error]` results before finishing.
