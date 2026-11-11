---
template_type: generic
default_category_tag: workflow
optional_top_level_headings:
  - '## Required Reading'
  - '## Preferred Tools'
  - '## Review Criteria'
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

## Required Reading

- Replace this scaffold with direct links to governing policies, labeled **Always** or **Before a named activity or decision**; omit this section only if there are no governing references.
- Require each applicable document to be read and applied before the dependent work. Read the full document unless an entry explicitly names a self-contained section; reuse complete reads already in context, not summaries or truncated output.
- Keep essential constraints at their decision points and optional background in Bundled Resources. Report unavailable required material and pause only the dependent work.

## When to Use

- Add the exact request shapes this skill owns.
- Keep the owned surface narrow and singular.
- Include trigger phrases a user might actually say.

## When Not to Use

- Add adjacent tasks that belong to a different skill or to general repo work.
- Reject requests that would broaden this skill into multiple surfaces.

## Preferred Tools

- Retain only concrete recommendations for this surface; otherwise omit this section.
- For each tool, link maintained upstream documentation and state only necessary compatibility minimums or ranges, when to prefer it, and material exceptions. Reference the recommendation where the workflow uses it.

## Workflow

- After explicit authorization, make the smallest safe change within the owned surface and preserve unrelated state.

1. Confirm the request matches this skill's single owned surface.
2. Load only the canon, inputs, and local resources required for this task.
3. Do the work using the narrowest reliable approach for this surface.
4. Validate the result before finishing.


## Review Criteria

Retain and tailor this section only for a persistent surface this skill can assess. Keep criteria read-only; implementation belongs in Workflow and execution checks in Validation. Remove inapplicable specialist subsections rather than leaving placeholders.

Use the shared operation lenses—**keep**, **reconcile**, **deduplicate**, **consolidate/merge**, **split**, **extract**, **move**, **tighten**, and **remove**—only where they fit this owned surface; do not manufacture changes to satisfy the list.

- **Inspect:** Inventory the existing files, state, and evidence that belong to this skill's singular surface.
- **Compare:** Apply the shared Preferred Tools adoption and freshness assessment: compare actual usage with the latest compatible stable release, recommend justified adoption or updates, and report retained exceptions or unverified evidence. Tailor compatibility, behavior, and migration-cost checks to this surface. Evaluate the observed surface against its durable local and shared contracts, including contradictions, duplication, overloaded artifacts, misplaced material, and obsolete state; classify unrelated areas as not applicable.
- **Recommend:** Preserve aligned state; reconcile conflicting representations; and prioritize justified deduplication, consolidation, splitting, extraction, movement, tightening, or removal.

### Architecture

- Retain only when this surface has architectural decisions to assess. Name the owned responsibilities, boundaries, or dependencies and concrete evidence that would justify keeping or changing them.
- Require the relevant existing sections and governing references before assessment, using direct links and explicit applicability; do not copy their doctrine or prescribe a universal layout.

### Testing

- Retain only when this surface has test contracts to assess. Name the guarantees and appropriate evidence boundaries, including what would justify retaining, replacing, or removing coverage.
- Require the relevant existing Testing or Validation sections and governing references before assessment. These criteria assess evidence; they do not authorize running the implementation workflow or live checks.

## Bundled Resources

- List only the canon files, prompts, scripts, templates, or assets this skill actually needs.
- Keep local resources local unless they clearly pass the hoist test.

## Validation

- Run the narrowest checks that prove the surface is aligned, then report any remaining uncertainty.

- List the concrete checks required before returning work.
- Prefer targeted validation that matches the owned surface.
