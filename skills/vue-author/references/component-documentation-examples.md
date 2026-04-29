# Component Documentation Examples

Use these examples only as fallbacks when the target project does not already have usable component and documentation patterns.

- Inspect the target project first for existing components, component docs pages, demo wrappers, global component registration, theme styles, and lint exceptions.
- Prefer project-local examples over this file when those examples already establish component docs structure.
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

## Fallback Component

Use this component shape only when the project has no stronger local component precedent.

```vue
<template>
  <section
    class="example-component"
    :data-framed="props.framed"
    :data-variant="props.variant"
  >
    <header class="example-component__header">
      <slot name="title" :title="resolvedTitle">{{ resolvedTitle }}</slot>
    </header>
    <div class="example-component__body">
      <slot :description="resolvedDescription">{{ resolvedDescription }}</slot>
    </div>
    <footer v-if="$slots.actions" class="example-component__actions">
      <slot name="actions" />
    </footer>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  description: {
    type: String,
    default: 'Example component body.',
  },
  framed: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Example component',
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'subtle'].includes(value),
  },
});

const resolvedDescription = computed(() => {
  const value = props.description?.trim();
  if (!value) return 'Example component body.';
  return value;
});

const resolvedTitle = computed(() => {
  const value = props.title?.trim();
  if (!value) return 'Example component';
  return value;
});
</script>

<style scoped lang="scss">
.example-component {
  display: block;
}
</style>
```

## Fallback Component Doc Demo

Use this wrapper when the project needs an interactive component docs primitive and has no existing equivalent.

The core contract is a `code` prop, a `source` prop, plus `controls-description`, `controls`, and `preview` slots. Use `source=false` to disable source links, pass a string to override the inferred source path, and allow `source=true` to infer `components/ExampleComponent.vue` from VitePress docs pages such as `components/example-component.md`. If the project already has a code highlighter, copy button, source-link helper, or VitePress code-block helper, use that local primitive instead of this minimal fallback renderer.

```vue
<template>
  <div class="component-doc-demo">
    <section class="component-doc-demo__group">
      <h3 class="component-doc-demo__title">Controls</h3>
      <p class="component-doc-demo__description">
        <slot name="controls-description">
          Adjust the controls to update both the live preview and the code sample.
        </slot>
      </p>
      <div class="component-doc-demo__controls">
        <slot name="controls" />
      </div>
    </section>

    <section class="component-doc-demo__group">
      <h3 class="component-doc-demo__title">Preview</h3>
      <div class="component-doc-demo__preview">
        <slot name="preview" />
      </div>
    </section>

    <section v-if="props.code" class="component-doc-demo__group">
      <h3 class="component-doc-demo__title">Code</h3>
      <div class="component-doc-demo__code" v-html="renderedCodeBlock"></div>
      <small v-if="resolvedSourceHref" class="component-doc-demo__source">
        <a :href="resolvedSourceHref" target="_blank" rel="noreferrer">source file</a>
      </small>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';

const props = defineProps({
  code: {
    type: String,
    default: '',
  },
  source: {
    type: [Boolean, String],
    default: true,
  },
});

const { page, theme } = useData();

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//.test(value);
}

function normalizeRepository(value) {
  return typeof value === 'string' ? value.replace(/\/$/, '') : '';
}

function toPascalComponentName(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function inferSourcePath(relativePath) {
  if (!relativePath?.startsWith('components/') || !relativePath.endsWith('.md')) {
    return '';
  }

  const fileName = relativePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
  const componentName = toPascalComponentName(fileName);

  return componentName ? `components/${componentName}.vue` : '';
}

function resolveSourcePath() {
  if (props.source === false || props.source === '') {
    return '';
  }

  if (typeof props.source === 'string') {
    return props.source;
  }

  return inferSourcePath(page.value.relativePath);
}

const renderedCodeBlock = computed(() => {
  if (!props.code) return '';
  return `<pre><code>${escapeHtml(props.code)}</code></pre>`;
});

const resolvedSourceHref = computed(() => {
  const sourcePath = resolveSourcePath();

  if (!sourcePath) {
    return '';
  }

  if (isAbsoluteUrl(sourcePath)) {
    return sourcePath;
  }

  const repository = normalizeRepository(theme.value.repository);

  if (!repository) {
    return '';
  }

  return `${repository}/blob/main/${sourcePath.replace(/^\/+/, '')}`;
});
</script>

<style scoped lang="scss">
.component-doc-demo {
  display: block;
}
</style>
```

## Fallback Markdown Docs Page

Use this page shape when documenting a component in VitePress and the project has no existing component docs page to follow.

Use the target project's established control-labeling convention. Keep examples or constraints in the docs text instead of baking a project-specific label, placeholder, or utility-class preference into this fallback. Keep fallback previews text-only; use trusted demo HTML only when the target project already has an explicit local convention for it.

````md
---
title: Example Component
description: Interactive example for the ExampleComponent Vue component.
---

# Example Component

`ExampleComponent` renders a project-local content block with title, body, and optional action content.

## Props

| Prop          | Type                    | Default                     | Notes                                                   |
| ------------- | ----------------------- | --------------------------- | ------------------------------------------------------- |
| `description` | `string`                | `'Example component body.'` | Fallback default-slot text when no slot is provided.    |
| `framed`      | `boolean`               | `false`                     | Enables the component's optional framed state.          |
| `title`       | `string`                | `'Example component'`       | Fallback title-slot text when no slot is provided.      |
| `variant`     | `'default' \| 'subtle'` | `'default'`                 | Selects the component mode.                             |

## Slots

| Slot       | Notes                                |
| ---------- | ------------------------------------ |
| `#actions` | Optional actions or secondary links. |
| `#title`   | Title or label content for the block. |
| `default`  | Main body content for the component. |

## Behavior Notes

The demo omits default-valued props from generated code. Boolean props render as presence attributes when enabled.

## Basic Usage

```html
<ExampleComponent />
<ExampleComponent variant="subtle">
  <template #title>
    Docs example
  </template>
  Body content can come from the default slot.
</ExampleComponent>

<ExampleComponent framed>
  <template #title>
    Framed example
  </template>
  <template #actions>
    <a href="/components/">Component index</a>
  </template>
  Body content can include project-local links.
</ExampleComponent>
```

## Demo

<script setup>
import { computed, ref } from 'vue';

const variant = ref('');
const framed = ref(false);
const titleSlot = ref('');
const defaultSlot = ref('');
const actionsSlot = ref('');

const fallbackTitleSlot = 'Example component';
const fallbackDefaultSlot = 'Example component body.';
const fallbackActionsSlot = '';

const resolvedVariant = computed(() => variant.value || 'default');
const resolvedTitleSlot = computed(() => titleSlot.value.trim() || fallbackTitleSlot);
const resolvedDefaultSlot = computed(() => defaultSlot.value.trim() || fallbackDefaultSlot);
const resolvedActionsSlot = computed(() => actionsSlot.value.trim() || fallbackActionsSlot);

function indentLines(value, spaces) {
  const prefix = ' '.repeat(spaces);
  return value
    .trim()
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function quoteProp(value) {
  return JSON.stringify(value);
}

const demoCode = computed(() => {
  const props = [];

  if (resolvedVariant.value !== 'default') props.push(`variant=${quoteProp(resolvedVariant.value)}`);
  if (framed.value) props.push('framed');

  const propString = props.length > 0 ? ` ${props.join(' ')}` : '';
  const actionsSlotBlock = resolvedActionsSlot.value
    ? `
  <template #actions>
${indentLines(resolvedActionsSlot.value, 4)}
  </template>`
    : '';

  return `<ExampleComponent${propString}>
  <template #title>
${indentLines(resolvedTitleSlot.value, 4)}
  </template>${actionsSlotBlock}
${indentLines(resolvedDefaultSlot.value, 2)}
</ExampleComponent>`;
});
</script>

<ComponentDocDemo :code="demoCode">
  <template #controls-description>
    Adjust the controls to update the live preview, slot contents, and code sample.
  </template>
  <template #controls>
    <label>
      <span>Variant</span>
      <select v-model="variant">
        <option value="">Variant</option>
        <option value="default">default</option>
        <option value="subtle">subtle</option>
      </select>
    </label>
    <label>
      <input v-model="framed" type="checkbox" />
      <span>Framed</span>
    </label>
    <label>
      <span>Title slot</span>
      <textarea v-model="titleSlot"></textarea>
    </label>
    <label>
      <span>Default slot</span>
      <textarea v-model="defaultSlot"></textarea>
    </label>
    <label>
      <span>Actions slot</span>
      <textarea v-model="actionsSlot"></textarea>
    </label>
  </template>
  <template #preview>
    <ExampleComponent :framed="framed" :variant="resolvedVariant">
      <template #title>{{ resolvedTitleSlot }}</template>
      <template v-if="resolvedActionsSlot" #actions>{{ resolvedActionsSlot }}</template>
      {{ resolvedDefaultSlot }}
    </ExampleComponent>
  </template>
</ComponentDocDemo>
````
