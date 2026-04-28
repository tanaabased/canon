# VitePress Markdown Pages

Use this reference for Markdown pages rendered inside VitePress or comparable docs-site surfaces when the task touches page UI, embedded Vue components, demos, layout markup, or page-local styling.

- Pair this reference with [front-end-preferences.md](./front-end-preferences.md) for Vue, VitePress, SCSS, and subtheme defaults.
- Pair it with [readme-standards.md](./readme-standards.md) only when deciding whether content belongs in a README or a fuller docs site.
- Keep this reference focused on VitePress Markdown implementation, not generic Markdown prose editing.
- Apply these rules only when the Markdown file is rendered inside a VitePress or comparable docs-site surface. Generic Markdown, README files, and prose-only docs outside that context do not inherit these UI rules.

## Ownership

- Let `tanaab-vitepress-author` own VitePress page implementation, docs-site structure, local subtheme wiring, and Markdown page UI.
- Let `tanaab-vue-author` own reusable Vue components used by those pages when component behavior, props, slots, emits, or SFC structure are the primary surface.
- Let `tanaab-readme-author` own repository `README.md` structure and README mode decisions.
- Do not create a separate Markdown skill unless a future Markdown surface has a distinct owner beyond README writing, VitePress page implementation, and Vue component work.

## Global Component Reuse

- Start by inspecting globally available components from the active VitePress theme, inherited or base theme, and local subtheme, plus markdown containers, theme styles, CSS variables, and tokens.
- Prefer project-local examples before bundled fallback examples. Existing component doc wrappers, documented components, and companion Markdown docs pages are the strongest starting points.
- Use existing global components for demos, grids, media embeds, callouts, layout primitives, and other repeated page UI patterns when the project already provides them.
- Use already-styled Markdown and semantic HTML before adding wrapper markup, bespoke classes, or new page-local Vue components.
- Prefer semantic HTML and existing accessible global components. Ad hoc ARIA or custom widget behavior belongs in reusable Vue or theme components, not page-local Markdown.
- Do not define ad hoc Vue components inside Markdown pages. Promote reusable needs into the theme, component, or style layer, or call out the missing primitive explicitly.
- Promote a pattern into the shared theme, component, or style layer when it is likely to appear on 2 or more pages, expresses site navigation or brand language, or would be awkward to maintain as copied Markdown.
- When a Markdown page reveals a missing shared component, style primitive, token, or layout pattern, call that out explicitly instead of hiding it inside page-local markup.

## Page-Local Glue

- Use page-local markup or `<style>` only when the behavior is narrow, content-specific, and unlikely to repeat.
- Keep page-local glue small enough that deleting the page also deletes the whole custom treatment without leaving a reusable pattern behind.
- Avoid page-local `<style>` blocks as the default answer for spacing, layout, cards, buttons, callouts, demos, or repeated visual treatments.
- Keep interactive demos page-local only when they explain that one page and do not define a reusable docs primitive.

## Markdown Writing

- Treat Markdown as content structure first: headings, prose, lists, examples, and links should carry the user-facing explanation.
- Do not turn Markdown into a layout language by stacking raw HTML wrappers when a shared component or theme style should own the presentation.
- Keep headings and section order concrete to the reader's task; avoid visual-only sections whose purpose depends on styling to make sense.
- Use VitePress features or existing components for repeated callouts, examples, and demos instead of hand-rolled markup blocks.

## Page Reachability

- When adding or moving a durable VitePress page, place it in the best existing sidebar, nav, index, collection, or equivalent route surface as part of the same change.
- Choose the information-architecture location from the site's current structure instead of asking by default.
- Do not leave durable pages orphaned. If the site has no clear IA surface, add the smallest reachable link from the nearest index or landing page and call out the structural gap.
