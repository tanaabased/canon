# Retiring `tanaab-coding`

## Decision

`tanaab-coding` should not survive as a live skill in `canon`.

The legacy folder remains under [`old-skills/tanaab-coding`](../old-skills/tanaab-coding/) as frozen migration evidence, but the router itself is retired.

## What Was Worth Keeping

These points are worth preserving, but they belong in ambient canon rather than in a router skill:

- choose one primary owner for a task before adding companions
- add companion skills only when the work truly crosses their surfaces
- treat user-facing artifacts such as generated `dist/` outputs, hosted scripts, and executable example suites as real task surfaces

Those rules now live in [`AGENTS.md`](../AGENTS.md).

## What Was Discarded

- the umbrella router workflow
- the requirement to activate `tanaab-coding-core`
- the `routing-matrix.md` model as a long-term dependency
- the skill UI metadata and default prompt

## Why

The router existed to compensate for overly broad downstream skills. Recreating it would preserve the old failure mode instead of fixing the underlying ownership problem.

The correct replacement is:

1. stronger `SKILL.md` descriptions
2. narrower one-surface successor skills
3. ambient repo guidance for shared ownership rules
