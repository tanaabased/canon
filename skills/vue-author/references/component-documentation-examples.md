# Component Documentation Examples

Use these fallback artifacts only when the target project does not already have usable component and documentation patterns.

- Inspect the target project first for existing components, component docs pages, playgrounds, global component registration, theme styles, and lint exceptions.
- Prefer project-local examples over these files when those examples already establish component docs structure.
- Keep component names, props, slots, and Markdown structure aligned with the actual project.
- Prefer a single top `## Usage` playground that combines representative live preview and generated component usage code.
- Cover meaningful public slots as well as props in fallback playground schemas.
- Include a source-link hook near generated code when a stable component source path or URL is available.
- Use `html` fences or highlighting for component usage snippets and generated template code; use `vue` only for full Vue single-file component examples.
- Pair this with [../../../references/vitepress-markdown-pages.md](../../../references/vitepress-markdown-pages.md) when the component is documented in a VitePress or docs-site Markdown page.
- Let the shared Markdown-page reference own global component reuse and page reachability rules for VitePress docs pages.

## Canonization Filter

- Keep reusable component structure, props/slots/emits patterns, playground schema shape, docs-page sections, source-link hooks, and generated-code behavior.
- Generalize project names, class names, source paths, demo copy, and example content before adding patterns here.
- Exclude target-project color, spacing, typography, focus, utility-class, control-labeling, placeholder, and brand-token choices.
- Use the target project's control-labeling convention in real docs pages; fallback examples should not decide whether visible labels, visually hidden labels, placeholders, or another control pattern is preferred.
- If a target project has a stronger local convention, follow it in that project without turning its visual doctrine into generic fallback guidance.

## Fallback Artifacts

- [../templates/example-component.vue](../templates/example-component.vue): generic fallback Vue SFC with props, boolean and enum states, default content, and public slots.
- [../templates/component-playground.vue](../templates/component-playground.vue): generic fallback VitePress component playground with `component`, `schema`, `source`, `initialState`, and `previewFit` contracts.
- [../templates/component-playground-codegen.js](../templates/component-playground-codegen.js): generic fallback schema-to-usage helper for playground state, preview props, and generated HTML usage code.
- [../templates/example-component.md](../templates/example-component.md): generic fallback VitePress component docs page with frontmatter, top Usage playground, props and slots tables, and behavior notes.

Use the four files together only when the target project lacks an equivalent local component, playground primitive, playground codegen helper, and docs page pattern. If the project already has one of those pieces, keep that local piece and adapt only the missing fallback artifact.

The bundled playground is a plain fallback. Reuse project-local interactive code, highlighter, copy-button, or source-link primitives when they already exist.

The `.vue` files are full Vue single-file component examples. The Markdown docs template treats generated component usage code as HTML because it represents rendered template usage, not complete SFC source. Do not add separate Basic Usage and Demo sections when the top Usage playground already covers both jobs.
