# Canon Repo Guidance

## Purpose

- This repo is the shared Tanaab canon surface for Codex, OpenClaw, and future agents.
- It may contain both executable skills and broader canon such as docs, templates, profiles, scripts, and standards.
- Treat `skills/` as the live skill surface and `old-skills/` as migration-only input unless a task explicitly says otherwise.

## Core Model

- `AGENTS.md` is ambient context. Use it for global rules, constraints, and conventions.
- `SKILL.md` is conditional context. Use it for reusable workflows that load only when triggered.
- Do not hide workflow logic in `AGENTS.md`.
- Do not duplicate global repo doctrine across multiple `SKILL.md` files when one ambient rule will do.

## Runtime Boundaries

- Skills must be self-contained at runtime.
- Repo-wide canon may assist authoring, extraction, or standardization, but shipped skills should bundle the references they need.
- Do not rely on `AGENTS.md` files inside skill storage paths to affect runtime behavior.
- Assume Codex requires a restart after skill install or update unless proven otherwise in the target environment.

## Skill Design

- Prefer small atomic skills with one clear owned surface.
- Avoid umbrella routers and mega-skills as the long-term steady state.
- Deterministic orchestrators are acceptable only when they call fixed sub-steps and do not act as dynamic routers.
- Prefer `merge`, `move`, `extract`, or `delete` before `add`.
- Treat description quality as the highest-leverage part of a skill because discovery depends on name plus description.
- Choose one primary owner for a multi-surface task and add companions only when the work truly crosses their surfaces.
- Treat user-facing artifacts such as generated `dist/` outputs, hosted scripts, and executable example suites as real ownership surfaces during skill design.
- If ownership needs a routing matrix to stay understandable, the skills are still too broad.

## Canon Design

- Put standards, guidance, and durable explanation in repo docs or canon files instead of overloading skills with philosophy.
- Put reusable scaffolds and fragments in `templates/` only after reuse is proven.
- Keep repo-level scripts support-focused. Do not turn them into accidental product surfaces without intent.

## Change Discipline

- Keep diffs small and local to the real problem.
- Do not widen a migration task into a rewrite unless the evidence shows the current shape is blocking the stated goal.
- When guidance is duplicated, move shared doctrine upward or delete the duplicate instead of preserving parallel copies.
- Call out ambiguity directly when two skills claim overlapping ownership.
- Keep `old-skills/` frozen as migration evidence. Retire legacy skills from the future live surface without rewriting their quarantined source folders.

## Validation

- Validate the narrowest reliable surface first.
- For skill work, check discovery shape, section structure, and bundled-resource paths.
- If live install sync or agent restart is intentionally skipped, say so explicitly.
