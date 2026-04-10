# Optimize Canon Repo

Use this prompt to plan a staged optimization pass on this repo so canon practices what it preaches.

Operate on this repo only. Treat `skills/` as the live skill surface and treat repo-root canon and plugin/package/docs surfaces as part of the live repo. Do not optimize `ideas/` as if it were live canon. Only mine `../ideas/old-skills-leftovers/bun-cli-support.js` if live CLI standardization proves it should be promoted.

Use repo evidence first. Only ask the user when a decision cannot be resolved from the repo's current canon, validators, or live surface shape.

## Planning Mode

- Always start by producing a concrete staged plan that follows the exact phase order below.
- Wrap that plan in a `<proposed_plan>` block and make it decision complete.
- Do not mutate the repo on the first pass for this prompt.
- Stop after the plan unless the user explicitly asks for implementation in a follow-up turn.

## Governing Canon

Use these files as the governing contract for the pass:

- [`../AGENTS.md`](../AGENTS.md)
- [`../references/skill-standard.md`](../references/skill-standard.md)
- [`../skills/tanaab-skill-author/SKILL.md`](../skills/tanaab-skill-author/SKILL.md)
- [`../references/javascript-repo-structure.md`](../references/javascript-repo-structure.md)
- [`../references/javascript-function-data-flow.md`](../references/javascript-function-data-flow.md)
- [`../references/coding-stack-preferences.md`](../references/coding-stack-preferences.md)
- [`../references/cli-style-rules.md`](../references/cli-style-rules.md)
- [`../references/readme-standards.md`](../references/readme-standards.md)
- [`../references/front-end-preferences.md`](../references/front-end-preferences.md) when touching Vue or VitePress support assets or examples
- [`../references/leia-markdown-scenarios.md`](../references/leia-markdown-scenarios.md) plus the hoisted Leia templates when touching CLI or hosted-script validation

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
- Prefer concrete implementation instructions over abstract commentary so the plan can be handed directly to an implementer.
- Do not widen into unrelated product code or external repos.
- Do not force `utils/` extraction when code is tightly coupled.
- Do not force hoisting just because something can be shared.
- Do not rewrite for stylistic neatness alone.

## Phase Order

### 1. Audit Skill Shape

- Audit all live skills under `../skills/` for keep, merge, split, rename, or delete decisions.
- Prefer one clear owned surface per skill.
- Flag overlap, routing behavior, or surfaces that should consolidate.
- For `type: coding` skills, check that broad discovery language still funnels into one dominant implementation pattern and that `Testing` and `GitHub Actions Workflow` each use one canonical mechanism.

Planning checkpoint:
- record keep/merge/split/delete decisions and the evidence for each

### 2. Tighten Skill Prose

- Remove contradictory ownership language, overlapping claims, and duplicate wording from skill prose.
- Keep each `SKILL.md` concise and discovery-oriented.
- Preserve the current owned surface unless the audit already established a keep/merge/split/delete change.
- Reduce repeated language across `Overview`, `When to Use`, `When Not to Use`, `Change Strategy`, and `Validation`.

Planning checkpoint:
- record which skills need tightening and any material boundary clarifications

### 3. Review Local vs Hoisted Support Material

- Review bundled references, templates, assets, and scripts for every touched skill.
- Demote hoisted files that no longer earn repo-root placement.
- Hoist only when 2+ live skills or 2+ live repo entrypoints need the same material unchanged, or the file clearly has repo-wide contract or standalone human value.
- Keep `guidance/` and `ideas/` cold-path unless the task explicitly calls for them.

Planning checkpoint:
- record hoisted, demoted, moved, deleted, or retained support material and why

### 4. Audit Code-Bearing Assets Against Repo Structure

- Review code-bearing skill subtrees such as `skills/**/scripts/`, helper code in templates, and any bundled runtime code against [`../references/javascript-repo-structure.md`](../references/javascript-repo-structure.md).
- Reorganize files into scope folders such as `bin/`, `utils/`, or `lib/` only when the repo-structure rules clearly support it.
- Hoist shared helpers only when reuse is proven and the helper is no longer surface-coupled.
- Keep repo-level `scripts/` flat and suffix-encoded as `-cli.js`, `-task.js`, or `-lib.js`.

Planning checkpoint:
- record structure fixes, retained exceptions, and any unresolved coupling

### 5. Standardize JS Library and Helper Code

- Use [`../skills/tanaab-javascript-author/SKILL.md`](../skills/tanaab-javascript-author/SKILL.md) as the standard for JS code-bearing skill assets and helpers.
- Prefer thin library wrappers around lower-coupling utility logic when that decomposition is honest.
- Ensure heavier, more generic, more testable logic lives in utility-style functions when it fits the repo-structure and function-shape rules.
- Ensure helper code is tested according to the current JS authoring canon.

Planning checkpoint:
- record utility extraction, wrapper thinning, retained coupled logic, and test changes

### 6. Standardize JS and Shell CLIs

- Use [`../skills/tanaab-javascript-cli-author/SKILL.md`](../skills/tanaab-javascript-cli-author/SKILL.md) for true Bun CLIs.
- Use [`../skills/tanaab-shell-cli-author/SKILL.md`](../skills/tanaab-shell-cli-author/SKILL.md) for shell CLIs.
- Ensure CLI help, version, precedence, structure, and validation follow the shared CLI canon.
- Use Leia-backed examples and the hoisted Leia workflow starter where the current CLI canon says they are the correct validation path.
- Treat [`../ideas/old-skills-leftovers/bun-cli-support.js`](../ideas/old-skills-leftovers/bun-cli-support.js) as a candidate source only if the live repo clearly needs promotion of that helper logic.

Planning checkpoint:
- record CLI standardization changes and whether `bun-cli-support.js` should stay cold-path or be promoted

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
- Ensure root `templates/` contains only proven shared scaffolds.
- Ensure `prompts/` contains only reusable prompts with clear cross-task value.
- Review root references and templates for hoist worthiness.
- Remove stale skill ids, old names, and dead references after merges, renames, or deletions.

Planning checkpoint:
- record repo-root consistency fixes, hoist reviews, and stale identity cleanup

### 8. Validate and Sweep

- Run [`../skills/tanaab-skill-author/scripts/validate-skill.js`](../skills/tanaab-skill-author/scripts/validate-skill.js) on every changed skill.
- Run stale-reference searches for renamed or deleted skills and moved files.
- Run targeted checks for touched code assets, helpers, or templates.
- Read back plugin, package, and docs surfaces if they changed.
- Report any required Codex restart or plugin-cache refresh notes.

Planning checkpoint:
- record validation steps, stale-reference sweep targets, and any remaining risks

## Final Output Shape

End with one decision-complete `<proposed_plan>` block grouped by:

- skill-surface changes
- hoist or local placement changes
- code-asset and structure changes
- repo-root consistency changes
- validation steps
- restart or reinstall notes for the Codex plugin cache if relevant

## Success Criteria

The planning pass is complete only when:

- live skills have clear owned surfaces with no unresolved contradictions
- duplicate language and overlapping claims are reduced materially
- local vs hoisted support material matches the repo hoist rules
- code-bearing assets follow the repo-structure canon where it honestly applies
- JS library/helper code and CLI surfaces follow the current Tanaab canon
- repo-root plugin/package/docs surfaces are consistent with the repo's own standards
- the final plan defines validation and stale-reference cleanup for every changed live surface
