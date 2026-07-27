# Optimize Canon Project

Use `$tanaab-project-optimizer` to assess this project's checked-in repository surfaces and determine whether a staged optimization pass is warranted so Canon practices what it preaches.

Operate on this repository only. Keep the first pass read-only and stop after a decision-complete proposal unless the user explicitly asks for implementation in a follow-up turn. A clean or mostly aligned result is valid.

## Canon Context

- Read `../AGENTS.md` first as the ambient repository contract.
- Treat every directory under `../skills/` containing `SKILL.md` as a live skill surface.
- Treat the root plugin, package, documentation, automation, executable, test, prompt, reference, template, asset, and validation surfaces as live when current tracked evidence gives them an active consumer.
- Treat `../guidance/` and `../ideas/` as cold-path canon. Inventory them, but optimize them only when a current live surface or the requested scope makes them relevant.
- Treat installed or generated plugin-cache state as generated evidence, not as the source of truth. The checked-in repository remains authoritative.
- Skip GitHub-hosted repository settings unless the user explicitly requests remote coverage and supplies or confirms the slug.

## Canon-Specific Audit Expectations

Follow the Project Optimizer workflow and its dynamic skill discovery. In addition:

1. Account for every live skill and apply only the installed Tanaab skills whose owned surfaces are observed and whose instructions expose `## Optimization`.
2. Because Canon contains multiple live skills, always select Skill Author and compare the collection as well as each skill for contradictions, duplicated doctrine, fragmented variants, unclear ownership, and mega-skill behavior.
3. Review top-level Canon ownership and hoisting against the flat-bucket and nearest-owner rules in `../AGENTS.md`.
4. Check consistency across the plugin manifest, package metadata, README and companion documentation, changelog, workflows, public and internal commands, tests, prompts, references, templates, assets, and lock or lint configuration when present.
5. Apply the shared optimization operations to each observed surface where appropriate, but do not manufacture work to exercise every operation.
6. Preserve current skill IDs, ownership boundaries, language choices, and user changes unless concrete evidence supports a change.
7. Prefer existing checks and supported commands. Do not propose a new validator or structural auditor for semantic placement judgments.
8. Classify aligned and not-applicable surfaces explicitly instead of manufacturing cleanup.

## Disposition Requirements

Return one grounded project-level disposition containing:

- a concise inventory of live, cold-path, generated, and not-applicable surfaces
- grouped aligned findings and specific evidence for every drifted surface
- one primary owning skill and one primary optimization operation for each recommendation, with companions only for genuine cross-surface work
- an individual and portfolio-wide disposition for the live skill collection, including keep, merge, split, move, extract, tighten, rename, or remove only where evidence supports it
- deferred questions only where repository evidence cannot resolve the decision

When action-worthy findings clear the Project Optimizer convergence gate, also include:

- recommended changes ordered by correctness risk, leverage, and dependency
- reviewable implementation and commit stages
- proportional validation for every proposed stage

When the project is converged, briefly account for intentionally deferred minor drift, report `converged — no optimization pass recommended`, and omit implementation and commit stages.

Do not return a generic checklist or restate the selected skills' Optimization sections. Stop before modifying files.

## Canon Validation and Cache Handoff

Derive targeted checks from the surfaces in the proposal. For a completed implementation that changes managed plugin or `codexsync` surfaces, the expected final baseline is:

```sh
bun run test
bun run lint
bun run codex:validate
git diff --check
bun run codex:check
```

If the final cache check reports drift, include `bun run codex:sync`, repeat `bun run codex:check`, and note that Codex should be restarted so updated skills reload. Do not synchronize the cache during the read-only planning pass.
