# Skills, Agents, and Canon Model

## Context Loading

Keep always-on rules in `AGENTS.md`. Let the active `SKILL.md` load the supplemental canon its task needs. The skill owns a concrete workflow, so it can select relevant context without making every task carry the whole library.

## Ownership Contracts

This guide explains context loading and its packaging consequences. Keep operational rules in their authoritative homes:

- [`../AGENTS.md`](../AGENTS.md) owns repository purpose, canon-bucket placement, and local-first hoisting rules.
- [`../references/skill-standard.md`](../references/skill-standard.md) owns skill structure, metadata, and validation.
- [`../references/javascript-repo-structure.md`](../references/javascript-repo-structure.md) owns code-bearing scope structure and source/test placement.

## Packaging

Install the complete plugin from npm or ClawHub, or use a local development checkout; individual skill folders are not self-contained. Follow the [README installation](../README.md#installation) and [development](../README.md#development) instructions.

This preserves shared canon paths. For example, `skills/readme-author/SKILL.md` links to `../../references/readme-standards.md`. Availability does not justify moving material to the root; the ownership rules above still apply.

Standalone per-skill export remains deferred. It would require bundling shared dependencies and rewriting references to their bundled paths.
