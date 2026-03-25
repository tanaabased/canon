# Canon Repo Guidance

## Purpose

- This repo is the shared Tanaab canon surface for Tanaab employees, Codex, OpenClaw, and future agents.
- It may contain both executable skills and broader canon such as guidance, ideas, references, prompts, templates, scripts, and standards.
- Treat `skills/` as the live skill surface and `old-skills/` as migration-only input unless a task explicitly says otherwise.

## Core Model

- `AGENTS.md` is ambient context. Use it for global rules, constraints, and conventions.
- `SKILL.md` is conditional context. Use it for reusable workflows that load only when triggered.
- Do not hide workflow logic in `AGENTS.md`.
- Do not duplicate global repo doctrine across multiple `SKILL.md` files when one ambient rule will do.

## Runtime Boundaries

- Skills may point to shared canon in this repo when that canon has human-accessible value beyond one skill.
- Do not duplicate shared references into individual skills just to force artificial runtime isolation.
- Bundle skill-local scripts, assets, templates, and other helpers only when they are specific to that skill and do not gain meaningful human-facing value by being hoisted into canon root.
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

- Keep `guidance/`, `ideas/`, `references/`, `prompts/`, `scripts/`, and `templates/` flat by default.
- Use hyphenated filenames with scoped prefixes when needed, such as `skill-standard.md`.
- Add nested folders inside the flat canon buckets only after repeated pressure shows flat naming is no longer the simpler model.
- Put standards, decision-shaping guidance, and durable explanation in `guidance/` instead of overloading skills with philosophy.
- Put exploratory or not-yet-adopted designs in `ideas/` so current guidance and reference material stay clean.
- Put stable lookup material such as contracts, naming rules, and other reference canon in `references/`.
- Put reusable agent-facing workflows in `skills/`, and keep those skills focused on triggered behavior rather than general canon explanation.
- Put reusable prompts and prompt fragments in `prompts/` when they have value beyond one skill.
- Put reusable scaffolds and fragments in `templates/` only after reuse is proven.
- Put repo-level scripts in `scripts/` when they support shared canon maintenance, validation, packaging, export, or install flows across multiple skills or folders.
- Keep repo-level scripts support-focused. Do not turn them into accidental product surfaces without intent.

## Change Discipline

- When guidance is duplicated, move shared doctrine upward or delete the duplicate instead of preserving parallel copies.
- Call out ambiguity directly when two skills claim overlapping ownership.
- Keep `old-skills/` frozen as migration evidence. Retire legacy skills from the future live surface without rewriting their quarantined source folders.

## Validation

- For skill work, check discovery shape, section structure, and bundled-resource paths.
- If live install sync or agent restart is intentionally skipped, say so explicitly.
