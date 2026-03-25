# Tanaab Canon

Shared canon and skills for Tanaab employees and agent systems.

## Purpose

- Ship reusable skills and canon for Tanaab employees, Codex, OpenClaw, and future agents.
- Hold broader canon such as standards, guidance, ideas, references, prompts, templates, scripts, and branding material.
- Let skills share canon references when that canon is useful beyond a single skill, while keeping skill-local helpers bundled only when they are truly skill-specific.

## Core Model

- `AGENTS.md` provides always-on rules and constraints.
- `SKILL.md` provides triggered workflows and task-specific behavior.
- Skills are executable capabilities.
- Canon is supporting guidance, standards, templates, and references.

## Repository Layout

```text
canon/
  AGENTS.md
  skills/
  guidance/
  ideas/
  references/
  prompts/
  templates/
  scripts/
  dist/codex/
  old-skills/
```

- `skills/` is the future live skill surface.
- `guidance/` holds decision-shaping canon such as audits, retirements, standards, and migration notes.
- `ideas/` holds exploratory proposals that may later mature into guidance, references, or shipped tooling.
- `references/` holds stable lookup canon such as contracts, naming rules, and other reference material.
- `prompts/` holds reusable prompts and prompt fragments with value beyond one skill.
- `old-skills/` is a frozen migration input, not a live runtime target.
- `dist/codex/` is reserved for generated Codex install output.
- Canon buckets stay flat by default.

## Runtime Notes

- Codex should prefer per-skill install or generated export and generally needs a restart after skill updates.
- OpenClaw should point `skills.load.extraDirs` at the repo `skills/` directory.
- Skills may refer to shared canon in this repo when that material has value beyond one skill.
- Skill-local scripts, assets, and templates should stay bundled only when they are specific to one skill and do not belong at canon root.
