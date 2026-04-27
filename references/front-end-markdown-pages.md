# Front-End Markdown Pages

Use this reference for VitePress or docs-site Markdown pages when the task touches page UI, embedded Vue components, demos, layout markup, or page-local styling.

- Pair this reference with [front-end-preferences.md](./front-end-preferences.md) for Vue, VitePress, SCSS, and subtheme defaults.
- Pair it with [readme-standards.md](./readme-standards.md) only when deciding whether content belongs in a README or a fuller docs site.
- Keep this reference focused on front-end Markdown implementation, not generic Markdown prose editing.

## Ownership

- Let `tanaab-vitepress-author` own VitePress page implementation, docs-site structure, local subtheme wiring, and Markdown page UI.
- Let `tanaab-vue-author` own reusable Vue components used by those pages when component behavior, props, slots, emits, or SFC structure are the primary surface.
- Let `tanaab-readme-author` own repository `README.md` structure and README mode decisions.
- Do not create a separate Markdown skill unless a future Markdown surface has a distinct owner beyond README writing, VitePress page implementation, and Vue component work.

## Reusable-First Page UI

- Start by inspecting existing global components, markdown containers, theme styles, CSS variables, tokens, and local subtheme patterns.
- Prefer project-local examples before bundled fallback examples. Existing component doc wrappers, documented components, and companion Markdown docs pages are the strongest starting points.
- Use already-styled Markdown and semantic HTML before adding wrapper markup, bespoke classes, or new page-local Vue components.
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
