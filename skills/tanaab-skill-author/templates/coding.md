---
template_type: coding
default_category_tag: implementation
---
---
name: {{skill_id}}
description: {{description}}
license: {{license}}
metadata:
  type: {{type}}
  owner: {{owner}}
  tags:
{{metadata_tags_yaml}}
---

# {{display_name}}

## Overview

{{description}}

## When to Use

- Use for skills that modify, generate, refactor, debug, or explain code.
- Keep the owned surface narrow to one code-centric artifact or workflow.
- Prefer requests that benefit from deterministic validation or repeatable code patterns.

## When Not to Use

- Do not use this type for skills centered on external-system setup, operational sequencing, or canon maintenance.
- Do not widen coding skills into repo routers or broad engineering doctrine dumps.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- Identify the narrowest code path that owns the change.
- Reuse existing patterns before adding new abstractions.

## Workflow

1. Confirm the request matches this skill's code-owned surface.
2. Load only the code, tests, and canon needed for the task.
3. Make the smallest coherent change and validate it directly.
4. Stop once the owned code path is complete and verified.

## Bundled Resources

- List only the code-specific canon, scripts, templates, or assets this skill actually needs.
- Keep local resources local unless they clearly pass the hoist test.

## Validation

- Run the narrowest relevant tests, lint, build, or smoke checks for the owned code path.
- Confirm the change did not widen scope or introduce unrelated drift.
