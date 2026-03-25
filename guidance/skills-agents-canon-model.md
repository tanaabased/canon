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

## Layer Responsibilities

Repo-root canon buckets stay flat by default. Use hyphenated scoped filenames before adding nested folders inside `guidance/`, `ideas/`, `references/`, `prompts/`, `scripts/`, or `templates/`.

### Global `AGENTS.md`

Use for:

- durable cross-repo agent behavior
- commentary, validation, and change-discipline defaults
- general rules for how repo-local `AGENTS.md` files should stay small and scoped

Do not use for:

- repo-specific routing
- package-specific canon paths
- required dependencies on installable skills or remote URLs

### Repo `AGENTS.md`

Use for:

- repo purpose and boundaries
- local folder ownership
- migration rules
- ambient repo policy that applies regardless of which skill is active

Do not use for:

- detailed task workflows
- large routing tables
- logic that exists only to decide which broad skill should win

### `SKILL.md`

Use for:

- one concrete owned task surface
- the workflow for that surface
- the canon references, guidance, templates, or scripts needed for that surface

Examples:

- a unit-function skill can load coding and testing references
- a Vue component skill can load coding, frontend, and design references
- a release-note skill can load release and changelog references

### `guidance/`

Use for:

- decision-shaping material
- architecture docs
- audits
- migrations
- rationale and tradeoff writeups

### `ideas/`

Use for:

- exploratory designs
- draft packaging models
- possible future automation or distribution approaches
- proposals that are not yet stable enough to become guidance or reference

### `references/`

Use for:

- stable lookup material
- engineering standards
- naming rules
- contracts
- field definitions
- install or packaging reference material once it stabilizes

### `prompts/`

Use for:

- reusable prompts
- prompt fragments
- starter prompt text with value beyond one skill

### `templates/`

Use for:

- reusable scaffolds and fragments that have already proven reusable

### `scripts/`

Use for:

- shared maintenance, validation, export, packaging, and install helpers

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

This should be the default authoring model.

### Flat per-skill export

In this mode, each skill is packaged as a portable standalone bundle.

This mode cannot assume sibling canon paths still exist. Shared canon must either:

- be vendored into the bundle, or
- have its references rewritten to bundled paths

This should be treated as an export concern, not the default authoring concern.

Detailed packaging and `canonfile` proposals currently live in [`../ideas/skill-bundle-export-action.md`](../ideas/skill-bundle-export-action.md) until the export contract is stable enough to freeze in `references/`.
