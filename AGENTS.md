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

## Project Management Model

- Treat GitHub as the canonical project-management implementation for Tanaab work.
- In Canon terminology, a project is represented by one GitHub repository, a task by one GitHub issue, a project milestone by one GitHub milestone, a change by a pull request, validation by checks or Actions results, and a release by a tag plus GitHub Release.
- The task owns task state. Every task requires a linked pull request as its completion submission; pull requests and checks provide completion evidence but are not themselves proof that the task is complete.
- Refer to an optional planning board explicitly as a GitHub Projects board; it is a view over project work, not the project's identity or source of truth.
- Apply the complete shared contract in [`references/project-management-model.md`](./references/project-management-model.md). Cross-project strategic goals remain outside this initial model.

## Runtime Boundaries

- Keep support material local to the owning skill by default.
- Apply [`references/github-cli-routing.md`](./references/github-cli-routing.md) to every agent- or code-owned GitHub CLI invocation. Resolve bare `gh` from the inherited `PATH` and preserve the active process environment and working directory so a host harness can route and bind the responsible agent.
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
- Apply the shared [`references/optimization-operations.md`](./references/optimization-operations.md) lenses to persistent surfaces during optimization, but do not manufacture changes to exercise every operation.
- Treat description quality as the highest-leverage part of a skill because discovery depends on name plus description.
- Choose one primary owner for a multi-surface task and add companions only when the work truly crosses their surfaces.
- Treat user-facing artifacts such as generated `dist/` outputs and executable example suites as real ownership surfaces during skill design.
- Treat Canon provenance and public skill namespace as separate identities. The namespace defaults to `tanaab`; a product repository may declare another durable namespace and its `standalone`, `codex-plugin`, or `openclaw-plugin` container here in `AGENTS.md`.
- When a project declares skill namespace or container overrides, pass them explicitly to Skill Author's scaffolder and validator; deterministic scripts do not parse `AGENTS.md` prose.
- In Codex- or OpenClaw-plugin skill trees, retain the configured public namespace in frontmatter and prompts but omit it from the skill folder name under `skills/`.
- If ownership needs a routing matrix to stay understandable, the skills are still too broad.
- When optimizing a collection of skills, review both each skill and the portfolio as a whole through Skill Author so overlap, contradictions, fragmented variants, and mega-skill behavior are visible.

## Canon Design

- Keep `guidance/`, `ideas/`, `references/`, `prompts/`, `scripts/`, and `templates/` flat by default.
- Use hyphenated filenames with scoped prefixes when needed, such as `skill-standard.md`.
- Add nested folders inside the flat canon buckets only after repeated pressure shows flat naming is no longer the simpler model.
- Shared coding-stack defaults for runtime, frameworks, and tooling live in `references/coding-stack-preferences.md`.
- Shared JS/TS/Bun repo-structure guidance for code-bearing surfaces lives in `references/javascript-repo-structure.md`.
- Shared JS/TS function-shape guidance lives in `references/javascript-function-data-flow.md`.
- Shared CLI, README, and frontend preference canon lives in `references/cli-style-rules.md`, `references/readme-standards.md`, and `references/front-end-preferences.md`.
- That repo-structure guidance applies inside every code-bearing owning scope, including individual skills, and in future coding repos. It does not override the flat top-level canon bucket rule in this repo.
- Inside a code-bearing scope, use `bin/` for public human-facing commands, `scripts/` for internal machine- or agent-facing commands, `lib/` for orchestration, `utils/` for independently testable units, and `test/` for tests owned by that scope.
- Keep each scope's `test/` directory flat by default. Put specs, fakes, fixtures, and test-support code directly beneath `test/` with descriptive filenames instead of mirroring source-role folders.
- Apply the same hoisting test to tests as to source; root `test/` is only for root-owned or intentionally cross-scope coverage.
- Put standards, decision-shaping guidance, and durable explanation in `guidance/` instead of overloading skills with philosophy.
- Put exploratory or not-yet-adopted designs in `ideas/` so current guidance and reference material stay clean.
- Put stable lookup material such as contracts, naming rules, and other reference canon in `references/`.
- Put reusable agent-facing workflows in `skills/`, and keep those skills focused on triggered behavior rather than general canon explanation.
- Put reusable prompts and prompt fragments in `prompts/` when they have value beyond one skill.
- Put reusable scaffolds and fragments in `templates/` when reuse is proven, when they are a repo-wide tooling surface, or when they are canonical human-facing starters with standalone copy/adapt value.
- If the reusable artifact is a whole starter repository with committed structure, scripts, examples, and docs, prefer a template repository over a repo-root template file.
- Put repo-level scripts in `scripts/` when they support shared canon maintenance, validation, packaging, export, or install flows across multiple skills or folders.
- Keep `scripts/` code-only. Machine-readable data should live with the smallest justified owner instead of being hoisted by default.
- Keep repo-root `scripts/` flat and role-encoded by suffix: `-cli.js` for human-invoked internal commands and `-task.js` for automation entrypoints. Put import-only modules in `lib/`.
- Keep repo-level scripts support-focused. Do not turn them into accidental product surfaces without intent.
- If a script may be bundled or exported, import its repo-owned runtime dependencies explicitly so `bun build` can follow them.

## Change Discipline

- When guidance is duplicated, move shared doctrine upward or delete the duplicate instead of preserving parallel copies.
- Call out ambiguity directly when two skills claim overlapping ownership.
- Before rolling a new canon release, run [`prompts/optimize-canon-project.md`](./prompts/optimize-canon-project.md) as a planning pass and review the resulting staged optimization plan.
- Treat optimizer convergence and release readiness as separate conclusions. Reconcile the unreleased changelog against the latest versioned tag and run `tanaab-release-author` independently.

## Validation

- For skill work, check discovery shape, section structure, and bundled-resource paths.
- For managed plugin or `codexsync` changes, run `bun run test`, `bun run lint`, `bun run codex:validate`, and `bun run codex:check`; if cache drift is reported, run `bun run codex:sync` and then `bun run codex:check` again.
- If cache sync or agent restart is intentionally skipped, say so explicitly.
