---
name: skill-sensei
description: Audit and optimize pirog and tanaab skill stacks. Use when a user asks to inventory a skill stack, surface duplicated doctrine or routing ambiguity, propose keep or merge or delete outcomes, or consolidate overlapping skills after the creation surface has been split out.
---

# Skill Sensei

## Overview

Use this legacy skill only for stack-audit and stack-optimize work that still lives under `old-skills/`.

- Default to `merge`, `move`, or `delete` before `add` when optimizing a skill stack.
- Treat creation and standardization work as owned by [../../skills/skill-creator/SKILL.md](../../skills/skill-creator/SKILL.md).

Read [references/stack-optimization.md](./references/stack-optimization.md) before auditing or consolidating a stack.

## When to Use

- Audit a stack such as `tanaab-coding` for duplication, overlap, routing ambiguity, and cross-skill inconsistencies.
- Propose or apply mergers, deletions, template extraction, or doctrine consolidation across a stack.
- Inventory what still remains in a legacy skill stack before later migration passes.

## When Not to Use

- Do not use this skill for new skill creation, skill standardization, or branded metadata and icon work. Use [../../skills/skill-creator/SKILL.md](../../skills/skill-creator/SKILL.md) for that surface.
- Do not use this skill for one-off repository edits that do not change skill-stack structure or ownership.

## Relationship to Other Skills

- [../../skills/skill-creator/SKILL.md](../../skills/skill-creator/SKILL.md) now owns skill creation and standardization.
- This remaining legacy surface only owns stack audit and consolidation until the rest of it is migrated.

## Workflow

1. Inventory the target stack.

- Identify each skill's owned surface, duplicated doctrine, routing overlap, and cross-skill inconsistencies.
- Use [references/stack-optimization.md](./references/stack-optimization.md) as the rubric.

2. Produce explicit keep, merge, move, extract, or delete outcomes before editing.

- Challenge thin or duplicated skills directly.
- Prefer consolidation over adding more routing or more surfaces.

3. Apply only the approved consolidation.

- Merge duplicated guidance upward.
- Delete obsolete or empty skills after their useful content has moved.
- Update surviving relationships and references so the stack reads coherently.

4. Sync live stow targets only when the change is meant to affect installed skills.

- Run [scripts/sync-ai-stow.js](./scripts/sync-ai-stow.js) after creating, renaming, consolidating, or deleting skills when the repo is stowed into `~/.codex` or `~/.openclaw`.
- Use `--simulate` first when you only need to inspect what `stow --restow ai` would change.

5. Validate before finishing.

- When auditing or optimizing a stack, confirm every retained skill has a distinct primary owned surface and a clear reason to exist.
- Confirm the stow sync completed or note that live target updates were intentionally skipped.

## Bundled Resources

- [references/stack-optimization.md](./references/stack-optimization.md): audit rubric for reducing duplication, overlap, and ambiguity across a skill stack
- [scripts/sync-ai-stow.js](./scripts/sync-ai-stow.js): restows the `ai` dot package and prunes dangling skill links in live targets

## Validation

- Confirm stack audits identify `keep`, `merge`, `move`, `extract`, or `delete` outcomes instead of drifting into vague commentary.
- Confirm stack audits explicitly call out cross-skill inconsistencies when ownership language, doctrine, terminology, examples, or validation rules diverge across the stack.
- Confirm stack optimizations reduce duplication or ambiguity rather than adding new surface area by default.
- Confirm `~/.codex/skills` and `~/.openclaw/skills` were resynced when the change was meant to affect live skill availability.
