---
template_type: meta
default_category_tag: skills
optional_top_level_headings:
  - '## Required Reading'
  - '## Preferred Tools'
  - '## Review Criteria'
---

---

name: {{skill_id}}
description: {{description_yaml}}
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

- Use for skills that create, refine, validate, package, or audit other skills, prompts, templates, or conventions.
- Keep the owned surface focused on one canon-facing artifact family.
- Prefer this type when consistency, structure, or contract enforcement matters more than implementation detail.

## When Not to Use

- Do not use this type for ordinary product work that merely references canon.
- Do not widen a meta skill into a router or a broad keep/merge/delete planner without a specific owned surface.

## Evaluation Criteria

- Check structure, naming, and consistency against shared canon.
- Prefer small, composable outputs over broad surfaces.

## Anti-Patterns

- Avoid router behavior, overlapping ownership, or duplicated doctrine.
- Treat repeated ambiguity as a signal to split or simplify.

## Iteration Loop

- Start with the smallest coherent change.
- Re-evaluate after validation before widening scope.

## Preferred Tools

- Retain only concrete recommendations for this surface; otherwise omit this section.
- For each tool, link maintained upstream documentation and state only necessary compatibility minimums or ranges, when to prefer it, and material exceptions. Reference the recommendation where the workflow uses it.

## Workflow

- After explicit authorization, make the smallest contract-aligned change and keep reusable support at its nearest justified owner.

1. Confirm the request matches this skill's canon-facing surface.
2. Load only the shared standard and local resources required for the task.
3. Create, standardize, or validate using the narrowest reliable approach.
4. Re-run validation before finishing and surface any manual review points.


## Review Criteria

Retain and tailor this section only for a persistent surface this skill can assess. Keep criteria read-only; implementation belongs in Workflow and execution checks in Validation. Remove inapplicable specialist subsections rather than leaving placeholders.

Use the shared operation lenses—**keep**, **reconcile**, **deduplicate**, **consolidate/merge**, **split**, **extract**, **move**, **tighten**, and **remove**—only where they fit this artifact family; do not manufacture changes to satisfy the list.

- **Inspect:** Inventory the existing artifact family, discovery metadata, structure, bundled resources, and validation evidence owned by this skill.
- **Compare:** Apply the shared Preferred Tools adoption and freshness assessment: compare actual usage with the latest compatible stable release, recommend justified adoption or updates, and report retained exceptions or unverified evidence. Tailor compatibility, behavior, and migration-cost checks to this surface. Evaluate each artifact and the collection against the shared contract and canonical template, including contradictions, duplicated doctrine, fragmented variants, overloaded owners, misplaced resources, and obsolete identities.
- **Recommend:** Preserve clear owners; reconcile conflicting contracts; and prioritize justified merging, splitting, extraction, movement, tightening, or removal without turning the skill into a router.

### Architecture

- Retain only when this surface has architectural decisions to assess. Name the owned responsibilities, boundaries, or dependencies and concrete evidence that would justify keeping or changing them.
- Require the relevant existing sections and governing references before assessment, using direct links and explicit applicability; do not copy their doctrine or prescribe a universal layout.

### Testing

- Retain only when this surface has test contracts to assess. Name the guarantees and appropriate evidence boundaries, including what would justify retaining, replacing, or removing coverage.
- Require the relevant existing Testing or Validation sections and governing references before assessment. These criteria assess evidence; they do not authorize running the implementation workflow or live checks.

## Bundled Resources

- List only the canon-facing files, scripts, templates, or assets this skill actually needs.
- Keep local resources local unless they clearly pass the hoist test.

## Validation

- Run the existing validator, review manual checks, and confirm the optimized artifact still owns one clear surface.

- Confirm the artifact still owns one narrow canon-facing surface.
- Validate that structure, naming, and local-vs-hoisted placement match the shared contract.
