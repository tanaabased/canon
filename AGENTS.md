# Canon Repo Guidance

## Purpose

- This repo is the shared Tanaab canon surface for Tanaab employees, Codex, OpenClaw, and future agents.
- It may contain both executable skills and broader canon such as guidance, ideas, references, prompts, templates, scripts, and standards.
- Treat `skills/` as the live skill surface.

## Core Model

- `AGENTS.md` is ambient context. Use it for global rules, constraints, and conventions.
- `SKILL.md` is conditional context. Use it for reusable workflows that load only when triggered.
- Do not hide workflow logic in `AGENTS.md`.
- Do not duplicate global repo doctrine across multiple `SKILL.md` files when one ambient rule will do.

## Runtime Boundaries

- Keep support material local to the owning skill by default.
- Hoist support material to repo root only when it is used by 2+ live skills or 2+ live repo entrypoints, is a true repo-wide contract or shared tooling surface, or is a cold-path human doc with standalone value.
- A hoisted file must reduce total complexity instead of merely moving it.
- Hoisted files with only one meaningful live consumer should be reviewed for demotion.
- `guidance/` and `ideas/` are cold-path canon and may remain hoisted with one live consumer, but should not be pulled into live skill hot paths by default.
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
- Shared coding-stack defaults for runtime, frameworks, and tooling live in `references/coding-stack-preferences.md`.
- Shared JS/Bun repo-structure guidance for code-bearing surfaces lives in `references/javascript-repo-structure.md`.
- Shared JS function-shape guidance lives in `references/javascript-function-data-flow.md`.
- Shared CLI, README, and frontend preference canon lives in `references/cli-style-rules.md`, `references/readme-standards.md`, and `references/front-end-preferences.md`.
- That repo-structure guidance applies inside code-bearing subtrees such as `skills/**/scripts/` and in future coding repos. It does not override the flat top-level canon bucket rule in this repo.
- Put standards, decision-shaping guidance, and durable explanation in `guidance/` instead of overloading skills with philosophy.
- Put exploratory or not-yet-adopted designs in `ideas/` so current guidance and reference material stay clean.
- Put stable lookup material such as contracts, naming rules, and other reference canon in `references/`.
- Put reusable agent-facing workflows in `skills/`, and keep those skills focused on triggered behavior rather than general canon explanation.
- Put reusable prompts and prompt fragments in `prompts/` when they have value beyond one skill.
- Put reusable scaffolds and fragments in `templates/` only after reuse is proven.
- Put repo-level scripts in `scripts/` when they support shared canon maintenance, validation, packaging, export, or install flows across multiple skills or folders.
- Keep `scripts/` code-only. Machine-readable data should live with the smallest justified owner instead of being hoisted by default.
- Keep `scripts/` flat and role-encoded by suffix: `-cli.js` for human-invoked Bun CLIs, `-task.js` for repo automation entrypoints, and `-lib.js` for import-only helpers.
- Keep repo-level scripts support-focused. Do not turn them into accidental product surfaces without intent.
- If a script may be bundled or exported, import its repo-owned runtime dependencies explicitly so `bun build` can follow them.

## Change Discipline

- When guidance is duplicated, move shared doctrine upward or delete the duplicate instead of preserving parallel copies.
- Call out ambiguity directly when two skills claim overlapping ownership.

## Validation

- For skill work, check discovery shape, section structure, and bundled-resource paths.
- If live install sync or agent restart is intentionally skipped, say so explicitly.
