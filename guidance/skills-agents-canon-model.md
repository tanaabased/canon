# Skills, Agents, and Canon Model

## Status

This document captures the current intended architecture for this repo. It is guidance, not yet a frozen reference contract.

## Core Decision

The primary place to load supplemental canon should be the relevant `SKILL.md`, not `AGENTS.md`.

Why:

- a skill already owns a concrete task surface
- the whole canon repo is expected to be installed together, so sibling canon paths are available on disk
- task-specific context stays narrow when loaded by the active skill
- this avoids rebuilding a giant router skill or a giant routing matrix in `AGENTS.md`

`AGENTS.md` still matters, but its role is narrower:

- always-on operating rules
- local repo policy
- small amounts of task-triggered repo context when that context is truly ambient

## Ownership Contracts

This document owns the rationale for skill-led context loading and the packaging consequences below. The operational contracts live elsewhere:

- [`../AGENTS.md`](../AGENTS.md) owns repository purpose, canon-bucket placement, and local-first hoisting rules.
- [`../references/skill-standard.md`](../references/skill-standard.md) owns skill structure, metadata, and validation.
- [`../references/javascript-repo-structure.md`](../references/javascript-repo-structure.md) owns code-bearing scope structure and source/test placement.

Keep those rules in their owning surfaces instead of restating them here. The durable distinction is that ambient policy belongs in `AGENTS.md`, one triggered workflow belongs in its `SKILL.md`, and deeper canon should load only through the active owner that needs it.

## Context Loading Model

The default rule is:

1. keep essential always-on behavior in `AGENTS.md`
2. let the active skill load the deeper canon it actually needs
3. keep unrelated canon out of context unless the task truly crosses into it

This is different from the retired `tanaab-coding` router model.

Why the old router failed:

- it was a skill pretending to be a dispatcher
- it owned no concrete task surface
- it forced indirection before real work could begin
- it depended on broad overlapping downstream skills

Why this model is better:

- the skill itself owns the decision to load relevant canon
- the loaded canon is tied to a concrete task surface
- `AGENTS.md` stays thin instead of becoming a general dispatcher

## Install Modes

### Shared-layout install

Examples:

- symlink the repo into a skills root
- extract a package archive that preserves the full repo layout

In this mode, skills may safely reference sibling canon such as:

- `../references/...`
- `../guidance/...`
- `../prompts/...`
- `../templates/...`
- `../scripts/...`

This should be the default authoring model, but it does not make hoisting the default. Shared-layout availability only means sibling canon can be referenced safely when it has already earned repo-root status.

### Flat per-skill export

In this mode, each skill is packaged as a portable standalone bundle.

This mode cannot assume sibling canon paths still exist. Shared canon must either:

- be vendored into the bundle, or
- have its references rewritten to bundled paths

This should be treated as an export concern, not the default authoring concern. Flat per-skill export remains deferred until there is a real packaging reference to freeze.
