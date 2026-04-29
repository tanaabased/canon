# Component Documentation Examples

Use these fallback artifacts only when the target project does not already have usable component and documentation patterns.

- Inspect the target project first for existing components, component docs pages, demo wrappers, global component registration, theme styles, and lint exceptions.
- Prefer project-local examples over these files when those examples already establish component docs structure.
- Keep component names, props, slots, and Markdown structure aligned with the actual project.
- Cover meaningful public slots as well as props in fallback docs demos.
- Include a source-link hook near generated code when a stable component source path or URL is available.
- Use `html` fences or highlighting for component usage snippets and generated template code; use `vue` only for full Vue single-file component examples.
- Pair this with [../../../references/vitepress-markdown-pages.md](../../../references/vitepress-markdown-pages.md) when the component is documented in a VitePress or docs-site Markdown page.
- Let the shared Markdown-page reference own global component reuse and page reachability rules for VitePress docs pages.

## Canonization Filter

- Keep reusable component structure, props/slots/emits patterns, docs-page sections, demo-wrapper contracts, source-link hooks, and generated-code behavior.
- Generalize project names, class names, source paths, demo copy, and example content before adding patterns here.
- Exclude target-project color, spacing, typography, focus, utility-class, control-labeling, placeholder, and brand-token choices.
- Use the target project's control-labeling convention in real docs pages; fallback examples should not decide whether visible labels, visually hidden labels, placeholders, or another control pattern is preferred.
- If a target project has a stronger local convention, follow it in that project without turning its visual doctrine into generic fallback guidance.

## Fallback Artifacts

- [../templates/example-component.vue](../templates/example-component.vue): generic fallback Vue SFC with props, boolean and enum states, default content, and public slots.
- [../templates/component-doc-demo.vue](../templates/component-doc-demo.vue): generic fallback VitePress docs demo wrapper with `code`, `source`, `controls-description`, `controls`, and `preview` contracts.
- [../templates/example-component.md](../templates/example-component.md): generic fallback VitePress component docs page with frontmatter, props and slots tables, behavior notes, `html` usage snippets, and an interactive demo.

Use the three files together only when the target project lacks an equivalent local component, demo wrapper, and docs page pattern. If the project already has one of the three pieces, keep that local piece and adapt only the missing fallback artifact.

The `.vue` files are full Vue single-file component examples. The Markdown docs template treats component usage snippets and generated demo code as HTML because they represent rendered template usage, not complete SFC source.
