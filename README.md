# Tanaab Canon

Shared canon and skills for Tanaab agent systems.

## Purpose

- Ship reusable skills for Codex, OpenClaw, and future agents.
- Hold broader canon such as standards, templates, profiles, docs, scripts, and branding guidance.
- Keep runtime skills portable instead of depending on repo-local context that may not be installed.

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
  docs/
  templates/
  profiles/
  scripts/
  dist/codex/
  old-skills/
```

- `skills/` is the future live skill surface.
- `old-skills/` is a frozen migration input, not a live runtime target.
- `dist/codex/` is reserved for generated Codex install output.

## Runtime Notes

- Codex should prefer per-skill install or generated export and generally needs a restart after skill updates.
- OpenClaw should point `skills.load.extraDirs` at the repo `skills/` directory.
- Skills must be self-contained at runtime even if authoring uses repo-wide canon during development.
