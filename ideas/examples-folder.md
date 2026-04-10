# `examples/` Folder Proposal

Keep this idea deferred until the repo shows clear pressure for a top-level `examples/` bucket.

## Summary

Add a repo-root `examples/` folder only if canon accumulates concrete, usable reference artifacts that are not well described as templates, references, guidance, ideas, or full template repositories.

The intended distinction would be:

- `templates/`: generic starters with placeholders, obvious substitution points, or copy/adapt intent
- `examples/`: concrete reference artifacts with real values and minimal placeholders
- template repositories: whole starter repos users should adopt wholesale

## Why This Is Deferred

- The current repo already has a working `templates/` bucket plus full template repositories for whole-repo start states.
- Adding `examples/` too early would create a new boundary without enough real pressure behind it.
- Prematurely adding the bucket would increase classification churn between `templates/`, `references/`, `ideas/`, and external template repos.

## Good Candidates for a Future `examples/` Bucket

- Concrete reference artifacts with real values and minimal placeholders
- Small, studyable end states that users can mirror or compare against
- Example files or fragments that are useful as completed references rather than as generic starters
- Artifacts that are not full template repositories and are not better treated as cold-path ideas

## Non-Candidates

- Generic starters with placeholders
- Full starter repositories with committed structure, scripts, examples, and docs
- Long explanatory material that belongs in `guidance/` or `references/`
- Skill-local examples that only serve one live skill
- Cold-path speculative concepts that still belong in `ideas/`

## Revisit Criteria

Revisit this idea only when at least one of these is true:

- 2 or more root-level concrete example artifacts clearly want to be hoisted and are not really templates
- repeated optimization passes keep finding placement ambiguity between `templates/` and “usable examples”
- users repeatedly need a concrete end-state artifact to study, not a starter to copy and adapt
- 2 or more live skills would benefit from pointing at the same completed reference artifact

## Implement-Now Checklist

Create `examples/` only if the answer is `yes` to all of these:

1. Do we have at least 2 concrete root-level artifacts that are not better as `templates/`, `references/`, `guidance/`, or template repos?
2. Do those artifacts use real values with minimal placeholders?
3. Are they useful as studyable end states rather than as starter scaffolds?
4. Will adding `examples/` reduce classification ambiguity instead of increasing it?
5. Can the new bucket stay flat without immediately needing nested folders?

## If Implemented Later

- Keep `examples/` flat by default.
- Use it for file- or fragment-level completed references, not whole repositories.
- Keep template repositories as the owner for full adopt-wholesale start states.
- Update `AGENTS.md`, repo optimization guidance, and any affected skills at the same time so the new bucket has one clear contract.
