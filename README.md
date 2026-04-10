# Tanaab Canon

Tanaab-based canon, skills, and plugin surfaces for Tanaab employees and agent systems.

## Purpose

- Ship reusable skills and canon for Tanaab employees, Codex, OpenClaw, and future agents.
- Hold broader canon such as standards, guidance, ideas, references, prompts, templates, scripts, and branding material.
- Keep support material local to the owning skill by default, and hoist it to repo root only when it clearly earns shared status.

## Core Model

- `AGENTS.md` provides always-on rules and constraints.
- `SKILL.md` provides triggered workflows and task-specific behavior.
- Skills are executable capabilities.
- Canon is supporting guidance, standards, and references, plus any cold-path shared material that still earns repo-root status.

## Repository Layout

```text
canon/
  AGENTS.md
  assets/
  bin/
  dist/
  guidance/
  ideas/
  prompts/
  references/
  scripts/
  skills/
  templates/
  utils/
```

- `skills/` is the live skill surface.
- `skills/skill-author/` owns the local hot-path scripts, templates, and assets for canon skill authoring.
- `assets/` holds shared plugin and canon branding material.
- `bin/`, `scripts/`, and `utils/` are intentional reserved root buckets for future shared canon tooling or code-bearing surfaces.
- `guidance/` holds decision-shaping canon such as audits, standards, and architecture notes.
- `ideas/` holds exploratory proposals that may later mature into guidance, references, or shipped tooling.
- `references/` holds stable lookup canon such as `skill-standard.md`, `coding-stack-preferences.md`, `javascript-repo-structure.md`, `javascript-function-data-flow.md`, `cli-style-rules.md`, `readme-standards.md`, `front-end-preferences.md`, and other shared reference material that still earns hoisting.
- `prompts/` holds reusable prompts and prompt fragments with value beyond one skill.
- `templates/` holds proven shared scaffolds, repo-wide tooling templates, and canonical human-facing starters.
- `dist/` is reserved for generated install or export output such as future Codex bundle material.
- Canon buckets stay flat by default.
- That flat-bucket rule applies to top-level canon organization. Code-bearing subtrees may still use purpose-scoped folders such as `bin/`, `utils/`, or `lib/` when `references/javascript-repo-structure.md` says they earn it.

## Runtime Notes

- Codex should prefer per-skill install or generated export and generally needs a restart after skill updates.
- OpenClaw should point `skills.load.extraDirs` at the repo `skills/` directory.
- `.mcp.json` is intentionally a stub until this repo exposes a real shared canon MCP server.
- Skills may refer to shared canon in this repo, but authoring is local-first rather than hoist-first.
- Hoist a file to repo root only when it is reused by 2+ live skills or entrypoints, is a true repo-wide contract or shared tooling surface, or is a cold-path human doc with standalone value.
- Hoisted files should reduce total complexity, and single-consumer hoists should be reviewed for demotion.
