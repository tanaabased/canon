---
name: {{skill_id}}
description: {{description}}
type: {{type}}
owner: {{owner}}
tags:
{{tags_yaml}}
---

# {{display_name}}

## Overview

{{description}}

## When to Use

- Add the exact request shapes this skill owns.
- Keep the owned surface narrow and singular.
- Include trigger phrases a user might actually say.

## When Not to Use

- Add adjacent tasks that belong to a different skill or to general repo work.
- Reject requests that would broaden this skill into multiple surfaces.

{{type_sections}}

## Workflow

1. Confirm the request matches this skill's single owned surface.
2. Load only the canon, inputs, and local resources required for this task.
3. Do the work using the narrowest reliable approach for this surface.
4. Validate the result before finishing.

{{post_workflow_sections}}

## Bundled Resources

- List only the canon files, prompts, scripts, templates, or assets this skill actually needs.
- Keep shared material at repo root; keep local resources only when they are unique to this skill.

## Validation

- List the concrete checks required before returning work.
- Prefer targeted validation that matches the owned surface.
