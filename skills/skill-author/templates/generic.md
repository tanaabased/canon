---
template_type: generic
default_category_tag: workflow
optional_top_level_headings:
  - '## Optimization'
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
  openclaw:
    emoji: {{openclaw_emoji}}
    homepage: {{openclaw_homepage}}
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

## Workflow

1. Confirm the request matches this skill's single owned surface.
2. Load only the canon, inputs, and local resources required for this task.
3. Do the work using the narrowest reliable approach for this surface.
4. Validate the result before finishing.

## Optimization

- **Inspect:** Inventory the existing files, state, and evidence that belong to this skill's singular surface.
- **Compare:** Evaluate the observed surface against its durable local and shared contracts; classify unrelated areas as not applicable.
- **Recommend:** Prioritize supported, high-leverage improvements and report an aligned surface without manufacturing work.
- **Apply:** After explicit authorization, make the smallest safe change within the owned surface and preserve unrelated state.
- **Verify:** Run the narrowest checks that prove the surface is aligned, then report any remaining uncertainty.

## Bundled Resources

- List only the canon files, prompts, scripts, templates, or assets this skill actually needs.
- Keep local resources local unless they clearly pass the hoist test.

## Validation

- List the concrete checks required before returning work.
- Prefer targeted validation that matches the owned surface.
