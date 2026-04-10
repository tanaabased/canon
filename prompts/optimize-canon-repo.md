# Optimize Canon Repo

Use this prompt to plan a staged optimization pass on this repo so canon practices what it preaches.

Operate on this repo only. Treat `skills/` as the live skill surface and treat repo-root canon and plugin/package/docs surfaces as part of the live repo. Do not optimize `ideas/` as if it were live canon.

Use repo evidence first. Only ask the user when a decision cannot be resolved from the repo's current canon, validators, or live surface shape.

## Planning and Proposal Mode

- Always start by producing a concrete staged optimization proposal that follows the exact phase order below.
- Use the phase order as the reasoning method, not as the main deliverable.
- Do not mutate the repo on the first pass for this prompt.
- Stop after the proposal unless the user explicitly asks for implementation in a follow-up turn.
- The first pass must recommend actual repo changes for the current repo, not just describe how you would audit it.

## Governing Canon

Use these files as the governing contract for the pass:

- [`../AGENTS.md`](../AGENTS.md)
- [`../references/skill-standard.md`](../references/skill-standard.md)
- [`../skills/skill-author/SKILL.md`](../skills/skill-author/SKILL.md)
- [`../references/javascript-repo-structure.md`](../references/javascript-repo-structure.md)
- [`../references/javascript-function-data-flow.md`](../references/javascript-function-data-flow.md)
- [`../references/coding-stack-preferences.md`](../references/coding-stack-preferences.md)
- [`../references/cli-style-rules.md`](../references/cli-style-rules.md)
- [`../references/readme-standards.md`](../references/readme-standards.md)
- [`../references/front-end-preferences.md`](../references/front-end-preferences.md) when touching Vue or VitePress support assets or examples
- [`../references/leia-markdown-scenarios.md`](../references/leia-markdown-scenarios.md) plus the hoisted Leia templates when touching CLI or other operational validation

Apply these repo rules throughout the pass:

- Prefer `merge`, `move`, `extract`, or `delete` before `add`.
- Keep support material local by default.
- Hoist only on proven reuse, repo-wide contract status, or standalone human value.
- Keep top-level canon buckets flat by default.
- Keep repo-level `scripts/` code-only and suffix-encoded.
- Treat plugin, package, README, and repo-root docs consistency as part of the live surface.

## Execution Rules

- Work in the exact phase order below when preparing the plan.
- Build the plan from repo evidence, not from generic cleanup instincts.
- Prefer concrete repo-specific recommendations and implementation instructions over abstract commentary so the plan can be handed directly to an implementer.
- Do not widen into unrelated product code or external repos.
- Do not force `utils/` extraction when code is tightly coupled.
- Do not force hoisting just because something can be shared.
- Do not rewrite for stylistic neatness alone.
- Do not stop at `audit`, `review`, or `check` language when repo evidence already supports a concrete keep, merge, split, rename, delete, tighten, demote, hoist, extract, or leave-as-is decision.

## Required Specificity

The final proposal must include concrete repo-specific conclusions, not just the phase outline. At minimum, include:

- an explicit keep, merge, split, rename, delete, or leave-as-is decision for every live skill
- the specific skills whose prose should be tightened, with the concrete contradiction, overlap, or duplicate language to remove
- the specific hoisted references or templates to keep, demote, review later, or mine for promotion
- the specific code-bearing subtrees that should be reorganized, and the recommended structure change
- the specific JS helper, library, or CLI surfaces that should be standardized first
- the specific repo-root inconsistencies to fix in `.codex-plugin`, `.mcp.json`, `package.json`, `README.md`, `AGENTS.md`, `prompts/`, or `templates/`, including any plugin description fields that drift from the `Tanaab-based ...` convention
- an implementation order that starts with the highest-leverage concrete changes, not with generic audit steps

## Disallowed Output Pattern

- Do not return a plan that mainly restates the phase order below.
- Do not use the phase list itself as the primary content of the final answer.
- The phase order is the analysis method; the deliverable is the concrete optimization proposal for this repo.

## Phase Order

### 1. Audit Skill Shape

- Audit all live skills under `../skills/` for keep, merge, split, rename, or delete decisions.
- Prefer one clear owned surface per skill.
- Flag overlap, routing behavior, or surfaces that should consolidate.
- For `type: coding` skills, check that broad discovery language still funnels into one dominant implementation pattern and that `Testing` and `GitHub Actions Workflow` each use one canonical mechanism.

Planning checkpoint:

- record concrete keep/merge/split/rename/delete decisions and the evidence for each

### 2. Tighten Skill Prose

- Remove contradictory ownership language, overlapping claims, and duplicate wording from skill prose.
- Keep each `SKILL.md` concise and discovery-oriented.
- Preserve the current owned surface unless the audit already established a keep/merge/split/delete change.
- Reduce repeated language across `Overview`, `When to Use`, `When Not to Use`, `Change Strategy`, and `Validation`.

Planning checkpoint:

- record which specific skills need tightening and the exact boundary or duplication problems to fix

### 3. Review Local vs Hoisted Support Material

- Review bundled references, templates, assets, and scripts for every touched skill.
- Demote hoisted files that no longer earn repo-root placement.
- Hoist only when 2+ live skills or 2+ live repo entrypoints need the same material unchanged, or the file clearly has repo-wide contract or standalone human value.
- Keep `guidance/` and `ideas/` cold-path unless the task explicitly calls for them.

Planning checkpoint:

- record which specific support files should stay local, stay hoisted, be demoted, or be promoted and why

### 4. Audit Code-Bearing Assets Against Repo Structure

- Review code-bearing skill subtrees such as `skills/**/scripts/`, helper code in templates, and any bundled runtime code against [`../references/javascript-repo-structure.md`](../references/javascript-repo-structure.md).
- Reorganize files into scope folders such as `bin/`, `utils/`, or `lib/` only when the repo-structure rules clearly support it.
- Hoist shared helpers only when reuse is proven and the helper is no longer surface-coupled.
- Keep repo-level `scripts/` flat and suffix-encoded as `-cli.js`, `-task.js`, or `-lib.js`.

Planning checkpoint:

- record which code-bearing subtrees need structure changes, which should stay as-is, and any unresolved coupling

### 5. Standardize JS Library and Helper Code

- Use [`../skills/javascript-author/SKILL.md`](../skills/javascript-author/SKILL.md) as the standard for JS code-bearing skill assets and helpers.
- Prefer thin library wrappers around lower-coupling utility logic when that decomposition is honest.
- Ensure heavier, more generic, more testable logic lives in utility-style functions when it fits the repo-structure and function-shape rules.
- Ensure helper code is tested according to the current JS authoring canon.

Planning checkpoint:

- record which concrete JS helper or library surfaces should be extracted, thinned, left coupled, or left alone

### 6. Standardize JS and Shell CLIs

- Use [`../skills/javascript-cli-author/SKILL.md`](../skills/javascript-cli-author/SKILL.md) for true Bun CLIs.
- Use [`../skills/shell-cli-author/SKILL.md`](../skills/shell-cli-author/SKILL.md) for shell CLIs.
- Ensure CLI help, version, precedence, structure, and validation follow the shared CLI canon.
- Review any repo-local CLI that exposes human-readable usage or help output, including maintenance CLIs, and align its help output order, labeling, and styling with [`../references/cli-style-rules.md`](../references/cli-style-rules.md).
- Use Leia-backed examples and the hoisted Leia workflow starter where the current CLI canon says they are the correct validation path.

Planning checkpoint:

- record which concrete CLI surfaces should be standardized first and what live canon should own any missing shared support

### 7. Audit Repo-Root Live Surfaces

- Review repo-root live canon and plugin/package/docs surfaces for self-consistency:
  - [`../.codex-plugin/plugin.json`](../.codex-plugin/plugin.json)
  - [`../.mcp.json`](../.mcp.json)
  - [`../package.json`](../package.json)
  - [`../README.md`](../README.md)
  - [`../AGENTS.md`](../AGENTS.md)
  - `../references/`
  - `../templates/`
  - `../prompts/`
- Ensure root `templates/` contains only proven shared scaffolds, repo-wide tooling templates, or canonical human-facing starters with standalone copy/adapt value.
- Ensure `prompts/` contains only reusable prompts with clear cross-task value.
- Ensure Codex plugin description metadata such as `description`, `interface.shortDescription`, and `interface.longDescription` starts with `Tanaab-based` unless repo evidence clearly justifies a different contract.
- Review root references and templates for hoist worthiness.
- Remove stale skill ids, old names, and dead references after merges, renames, or deletions.

Planning checkpoint:

- record which concrete repo-root consistency fixes, hoist reviews, and stale identity cleanups are recommended

### 8. Validate and Sweep

- Run [`../skills/skill-author/scripts/validate-skill.js`](../skills/skill-author/scripts/validate-skill.js) on every changed skill.
- Run stale-reference searches for renamed or deleted skills and moved files.
- Run targeted checks for touched code assets, helpers, or templates.
- Read back plugin, package, and docs surfaces if they changed.
- Report any required Codex restart or plugin-cache refresh notes.

Planning checkpoint:

- record the exact validation steps, stale-reference sweep targets, and any remaining risks

## Final Output Shape

End with one decision-complete optimization proposal grouped by:

- skill-surface changes
- hoist or local placement changes
- code-asset and structure changes
- repo-root consistency changes
- validation steps
- restart or reinstall notes for the Codex plugin cache if relevant

If the client supports `<proposed_plan>`, wrap the final proposal in that block. If not, return the same content as plain Markdown with the same section structure.

## Success Criteria

The planning pass is complete only when:

- live skills have clear owned surfaces with no unresolved contradictions
- duplicate language and overlapping claims are reduced materially
- local vs hoisted support material matches the repo hoist rules
- code-bearing assets follow the repo-structure canon where it honestly applies
- JS library/helper code and CLI surfaces follow the current Tanaab canon
- repo-root plugin/package/docs surfaces are consistent with the repo's own standards
- the final proposal defines validation and stale-reference cleanup for every changed live surface
