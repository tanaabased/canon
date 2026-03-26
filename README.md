# Tanaab Canon

Shared canon and skills for Tanaab employees and agent systems.

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
  skills/
  guidance/
  ideas/
  references/
  prompts/
  dist/codex/
  old-skills/
```

- `skills/` is the future live skill surface.
- `skills/tanaab-skill-author/` owns the local hot-path scripts, templates, and assets for canon skill authoring.
- `guidance/` holds decision-shaping canon such as audits, retirements, standards, and migration notes.
- `ideas/` holds exploratory proposals that may later mature into guidance, references, or shipped tooling.
- `references/` holds stable lookup canon such as `skill-standard.md` and other shared reference material that still earns hoisting.
- `prompts/` holds reusable prompts and prompt fragments with value beyond one skill.
- `old-skills/` is a frozen migration input, not a live runtime target.
- `dist/codex/` is reserved for generated Codex install output.
- Canon buckets stay flat by default.

## Runtime Notes

- Codex should prefer per-skill install or generated export and generally needs a restart after skill updates.
- OpenClaw should point `skills.load.extraDirs` at the repo `skills/` directory.
- Skills may refer to shared canon in this repo, but authoring is local-first rather than hoist-first.
- Hoist a file to repo root only when it is reused by 2+ live skills or entrypoints, is a true repo-wide contract or shared tooling surface, or is a cold-path human doc with standalone value.
- Hoisted files should reduce total complexity, and single-consumer hoists should be reviewed for demotion.
