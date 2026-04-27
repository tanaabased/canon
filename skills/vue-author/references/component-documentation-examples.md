# Component Documentation Examples

Use these examples only as fallbacks when the target project does not already have usable component and documentation patterns.

- Inspect the target project first for existing components, component docs pages, demo wrappers, global component registration, theme styles, and lint exceptions.
- Prefer project-local examples over this file. In `@tanaabased/theme`, that means patterns like `TMSComponentDocDemo.vue`, `TMSLogo.vue`, and `tms-logo.md` should guide new component docs before these generic examples.
- Keep names, props, slots, class hooks, and Markdown structure aligned with the actual project.
- Cover meaningful public slots as well as props in fallback docs demos.
- Include a source-link hook near generated code when a stable component source path or URL is available.
- Pair this with [../../../references/front-end-markdown-pages.md](../../../references/front-end-markdown-pages.md) when the component is documented in a VitePress or docs-site Markdown page.

## Fallback Component

Use this component shape only when the project has no stronger local component precedent.

```vue
<template>
  <section class="example-component" :data-variant="props.variant">
    <header class="example-component__header">
      <slot name="title" :title="resolvedTitle">{{ resolvedTitle }}</slot>
    </header>
    <div class="example-component__body">
      <slot :description="resolvedDescription">{{ resolvedDescription }}</slot>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  description: {
    type: String,
    default: 'Example component body.',
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

.example-component__header,
.example-component__body {
  min-width: 0;
}
</style>
```

## Fallback Component Doc Demo

Use this wrapper when the project needs an interactive component docs primitive and has no existing equivalent.

The core contract is a `code` prop, an optional `source` link, plus `controls-description`, `controls`, and `preview` slots. If the project already has a code highlighter, copy button, source-link helper, or VitePress code-block helper, use that instead of this minimal fallback renderer.

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

const props = defineProps({
  code: {
    type: String,
    default: '',
  },
  source: {
    type: String,
    default: '',
  },
});

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const renderedCodeBlock = computed(() => {
  if (!props.code) return '';
  return `<div class="language-vue vp-adaptive-theme"><span class="lang">vue</span><pre class="vp-code"><code>${escapeHtml(props.code)}</code></pre></div>`;
});

const resolvedSourceHref = computed(() => props.source.trim());
</script>

<style scoped lang="scss">
.component-doc-demo {
  display: grid;
  gap: 2rem;
  margin-top: 1rem;
}

.component-doc-demo__group {
  display: grid;
  gap: 1rem;
}

.component-doc-demo__title,
.component-doc-demo__description {
  margin: 0;
}

.component-doc-demo__controls {
  display: grid;
  gap: 1rem;
}

.component-doc-demo__preview {
  display: flex;
  align-items: center;
  min-height: 180px;
}

.component-doc-demo__controls :deep(label) {
  display: grid;
  gap: 0.35rem;
}
</style>
```

## Fallback Markdown Docs Page

Use this page shape when documenting a component in VitePress and the project has no existing component docs page to follow.

Use the target project's visually hidden label utility for controls that use placeholder-style prompts. In `@tanaabased/theme`, use `.tms-visually-hidden`. Keep placeholders concise and put examples or constraints in surrounding docs text instead of placeholder strings.

````md
---
title: Example Component
description: Interactive example for the ExampleComponent Vue component.
---

# Example Component

`ExampleComponent` renders a project-local content block with a title slot, default slot, and visual variant.

## Props

| Prop          | Type                    | Default                     | Notes                                                |
| ------------- | ----------------------- | --------------------------- | ---------------------------------------------------- |
| `description` | `string`                | `'Example component body.'` | Fallback default-slot text when no slot is provided. |
| `title`       | `string`                | `'Example component'`       | Fallback title-slot text when no slot is provided.   |
| `variant`     | `'default' \| 'subtle'` | `'default'`                 | Selects the component's visual treatment.            |

## Slots

| Slot      | Notes                                  |
| --------- | -------------------------------------- |
| `#title`  | Title or label content for the block.  |
| `default` | Main body content for the component.   |

## Basic Usage

```vue
<ExampleComponent />
<ExampleComponent variant="subtle">
  <template #title>
    Docs example
  </template>
  Body content can come from the default slot.
</ExampleComponent>
```

## Demo

<script setup>
import { computed, ref } from 'vue';

const variant = ref('');
const titleSlot = ref('');
const defaultSlot = ref('');

const fallbackTitleSlot = 'Example component';
const fallbackDefaultSlot = 'Example component body.';

const resolvedVariant = computed(() => variant.value || 'default');
const resolvedTitleSlot = computed(() => titleSlot.value.trim() || fallbackTitleSlot);
const resolvedDefaultSlot = computed(() => defaultSlot.value.trim() || fallbackDefaultSlot);

function indentLines(value, spaces) {
  const prefix = ' '.repeat(spaces);
  return value
    .trim()
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

const demoCode = computed(() => {
  const variantProp = resolvedVariant.value === 'default' ? '' : ` variant="${resolvedVariant.value}"`;

  return `<ExampleComponent${variantProp}>
  <template #title>
${indentLines(resolvedTitleSlot.value, 4)}
  </template>
${indentLines(resolvedDefaultSlot.value, 2)}
</ExampleComponent>`;
});
</script>

<ComponentDocDemo :code="demoCode" source="components/ExampleComponent.vue">
  <template #controls-description>
    Adjust the controls to update the live preview, slot contents, and code sample.
  </template>
  <template #controls>
    <label>
      <span class="visually-hidden">Variant</span>
      <select v-model="variant">
        <option value="">Variant</option>
        <option value="default">default</option>
        <option value="subtle">subtle</option>
      </select>
    </label>
    <label>
      <span class="visually-hidden">Title slot</span>
      <textarea v-model="titleSlot" placeholder="Title slot"></textarea>
    </label>
    <label>
      <span class="visually-hidden">Default slot</span>
      <textarea v-model="defaultSlot" placeholder="Default slot"></textarea>
    </label>
  </template>
  <template #preview>
    <ExampleComponent :variant="resolvedVariant">
      <template #title>{{ resolvedTitleSlot }}</template>
      {{ resolvedDefaultSlot }}
    </ExampleComponent>
  </template>
</ComponentDocDemo>
````
