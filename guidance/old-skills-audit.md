# Legacy Skills Audit

## Scope

This audit covers the quarantined legacy stack imported into [`old-skills/`](../old-skills/). The goal is not to preserve that stack as-is. The goal is to decide which parts should survive into `canon`, which parts belong in ambient repo guidance instead of skills, and which broad skills should be split into narrower single-surface successors.

## Summary

The legacy stack is internally consistent, but it is the wrong shape for a shared multi-agent repo:

- `tanaab-coding` is an explicit router skill.
- `tanaab-coding-core` is always-on doctrine and should not be a conditional skill.
- many skills depend on sibling skills and sibling references at runtime.
- `tanaab-templates` contains real canon assets, not just workflow guidance.
- most specialized skills each own multiple distinct surfaces and should be split.

The right migration path is:

1. move ambient doctrine into repo-level canon and `AGENTS.md`
2. move reusable artifacts into repo-level `templates/`, `guidance/`, `references/`, and `scripts/`
3. retire the router and core skills
4. replace broad domain skills with smaller single-surface skills

## Inventory

| Legacy skill | Current role | Main issue | Recommended outcome |
| --- | --- | --- | --- |
| `skill-sensei` | meta skill authoring and stack optimization | broad but intentionally meta | keep temporarily, then split |
| `tanaab-coding` | stack router | explicit router dependency | delete |
| `tanaab-coding-core` | always-on doctrine | ambient rules encoded as a skill | move to core, then delete |
| `tanaab-documentation` | docs strategy and authoring | multiple owned surfaces | split |
| `tanaab-frontend` | Vue, VitePress, SCSS | multiple owned surfaces | split |
| `tanaab-github-actions` | workflow authoring and CI triage | multiple owned surfaces | split |
| `tanaab-javascript` | Bun, ESM, package, CLI, JS action code | multiple owned surfaces | split |
| `tanaab-release` | changelog, release readiness, release contract | multiple owned surfaces | split |
| `tanaab-shell` | shell scripting, CLI contract, hosted scripts | multiple owned surfaces | split |
| `tanaab-templates` | reusable templates and template policy | canon assets hidden behind a skill | extract to canon, then delete |
| `tanaab-testing` | test strategy, implementation, gates | multiple owned surfaces | split |

## Overlap Findings

- `tanaab-coding` and `tanaab-coding-core` exist largely to coordinate or constrain other skills instead of owning a concrete task surface.
- `tanaab-javascript` overlaps with `tanaab-shell` on CLI work and with `tanaab-github-actions` on JavaScript action work.
- `tanaab-documentation` overlaps with `tanaab-frontend` on docs-site work.
- `tanaab-testing`, `tanaab-github-actions`, and `tanaab-release` all touch CI and release gates from different angles.
- `tanaab-templates` is treated as a companion for nearly every skill, which is a strong sign that its assets belong in canon rather than behind a conditional runtime skill.

## Routing Ambiguity Findings

- The routing matrix in [`old-skills/tanaab-coding/references/routing-matrix.md`](../old-skills/tanaab-coding/references/routing-matrix.md) proves the stack depends on a non-trivial router to decide ownership.
- Several collision rules are really evidence that the underlying skills are too broad. For example, JavaScript CLI implementation and CLI contract are split across `tanaab-javascript` and `tanaab-shell`, and docs-site structure versus docs-site implementation are split across `tanaab-documentation` and `tanaab-frontend`.
- Requiring `tanaab-coding-core` for every specialized task means the specialized skills are not self-contained enough for shared discovery.

## Cross-Skill Inconsistency Findings

- The stack says skills should be self-contained, but many `Bundled Resources` sections reference sibling skill files such as `../tanaab-coding-core/references/cli-style-rules.md`.
- The stack says templates are optional, but the current template skill owns a large amount of real reusable content that should live at repo level.
- The stack distinguishes canon from skills conceptually, but the old implementation still stores doctrine, references, and reusable assets inside live skill folders.

## Per-Skill Decisions

### `skill-sensei`

Decision: keep temporarily as the migration utility, then split.

Why:

- it is intentionally meta and already owns stack audit, standardization, and validation behavior
- it maps well to the future meta-skill loop from the handoff

Recommended successors:

- `skill-extractor`
- `skill-refiner`
- `skill-validator`
- `skill-packager`

### `tanaab-coding`

Decision: delete.

Why:

- it is explicitly a router, and the handoff says to avoid router or mega-skills
- its routing rules should be replaced by better skill descriptions and a cleaner repo-level canon model, not another router

Migration target:

- preserve the quarantined source folder under `old-skills/` as migration evidence
- keep only the primary-owner and real-surface rules by moving them into repo `AGENTS.md`
- keep the current routing matrix only as temporary migration documentation if needed

### `tanaab-coding-core`

Decision: move to core, then delete the skill.

Why:

- its description is ambient doctrine, not a conditional workflow
- its content belongs in repo `AGENTS.md`, repo guidance, repo references, and repo support files

Migration target:

- move doctrine into root `AGENTS.md`
- move CLI rules into repo references or profiles
- keep only the smallest repo-level helper scripts that still earn a place after the new type-plus-owner initializer model

### `tanaab-templates`

Decision: extract to canon, then delete the skill.

Why:

- it already contains real reusable assets under `templates/`
- those assets should be shared canon, not hidden behind a runtime skill

Migration target:

- move concrete file starters into repo `/templates`
- move template policy into guidance
- only create a future template meta-skill if template extraction or standardization truly needs executable workflow

### `tanaab-javascript`

Decision: split.

Why:

- one skill currently owns Bun migration, ESM conversion, package metadata, JavaScript CLI code, and JavaScript GitHub Action code
- those are distinct discovery surfaces and they create repeated handoff rules to other skills

Recommended successors:

- `bun-migration`
- `esm-conversion`
- `package-metadata`
- `javascript-cli`
- `javascript-action-runtime`

### `tanaab-frontend`

Decision: split.

Why:

- Vue component work, VitePress work, and SCSS guidance are distinct surfaces with different triggers and artifacts

Recommended successors:

- `vue-3`
- `vitepress-1`
- `scss-styling`

### `tanaab-documentation`

Decision: split.

Why:

- README structure, docs-surface selection, inline code docs, and API docs are not one thing
- the current skill also carries policy overlap with frontend and release work

Recommended successors:

- `readme-structure`
- `docs-surface-selection`
- `inline-code-docs`
- `api-docs`

### `tanaab-github-actions`

Decision: split.

Why:

- workflow authoring, reusable workflows, JavaScript action workflow support, and CI triage are separate surfaces

Recommended successors:

- `workflow-authoring`
- `reusable-workflows`
- `ci-triage`
- `javascript-action-workflows`

### `tanaab-testing`

Decision: split.

Why:

- testing strategy, focused JS or TS test implementation, coverage policy, and workflow test gates are separate concerns

Recommended successors:

- `test-strategy`
- `javascript-unit-tests`
- `coverage-policy`
- `github-action-smoke-tests`
- `leia-scenarios`

### `tanaab-release`

Decision: split.

Why:

- changelog drafting, release readiness, and release contract decisions are distinct surfaces

Recommended successors:

- `changelog-drafting`
- `release-readiness`
- `version-contract`

### `tanaab-shell`

Decision: split.

Why:

- shell scripting, CLI contract, and hosted script distribution are separate surfaces

Recommended successors:

- `shell-scripting`
- `cli-contract`
- `hosted-script-conventions`

## Ordered Implementation Plan

1. Keep `old-skills/` frozen and do not normalize it in place.
2. Promote ambient doctrine from `tanaab-coding-core` into repo `AGENTS.md`, canon guidance, and canon references.
3. Move real reusable assets out of `old-skills/tanaab-templates/templates/` into repo `/templates`.
4. Move supporting references out of legacy skills into repo `/references`, `/profiles`, or `/scripts` where they are truly canon.
5. Retire `tanaab-coding`, `tanaab-coding-core`, and `tanaab-templates` instead of recreating them as live skills.
6. Rebuild each remaining broad domain skill as a set of narrower successor skills with one primary owned surface each.
7. Rewrite every new `SKILL.md` so the description alone is strong enough to avoid rebuilding a router.
8. Add validation that checks section shape, description quality, and forbidden lateral runtime dependencies.

## Recommendation

Do not optimize for the maximum possible number of skills. Optimize for one clear owned surface per skill. That still yields many more skills than the legacy stack, but it avoids replacing one mega-stack with dozens of ambiguous fragments.
