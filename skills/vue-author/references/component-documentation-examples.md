# Component Documentation Examples

Use these examples only as fallbacks when the target project does not already have usable component and documentation patterns.

- Inspect the target project first for existing components, component docs pages, demo wrappers, global component registration, theme styles, and lint exceptions.
- Prefer project-local examples over this file. In `@tanaabased/theme`, that means patterns like `TMSComponentDocDemo.vue`, `TMSLogo.vue`, and `tms-logo.md` should guide new component docs before these generic examples.
- Keep names, props, slots, class hooks, and Markdown structure aligned with the actual project.
- Pair this with [../../../references/front-end-markdown-pages.md](../../../references/front-end-markdown-pages.md) when the component is documented in a VitePress or docs-site Markdown page.

## Fallback Component

Use this component shape only when the project has no stronger local component precedent.

```vue
<template>
  <a class="example-component" :href="resolvedHref" :data-variant="props.variant">
    <span class="example-component__label">{{ resolvedLabel }}</span>
  </a>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: {
    type: String,
    default: 'Example',
  },
  href: {
    type: String,
    default: '/',
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'subtle'].includes(value),
  },
});

const resolvedLabel = computed(() => {
  const value = props.label?.trim();
  if (!value) return 'Example';
  return value;
});

const resolvedHref = computed(() => {
  const value = props.href?.trim();
  if (!value) return '/';
  return value;
});
</script>

<style scoped lang="scss">
.example-component {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
}
</style>
```

## Fallback Component Doc Demo

Use this wrapper when the project needs an interactive component docs primitive and has no existing equivalent.

The core contract is a `code` prop plus `controls-description`, `controls`, and `preview` slots. If the project already has a code highlighter, copy button, or VitePress code-block helper, use that instead of this minimal fallback renderer.

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
      <div v-html="renderedCodeBlock"></div>
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
});

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const renderedCodeBlock = computed(() => {
  if (!props.code) return '';
  return `<div class="language-vue vp-adaptive-theme"><span class="lang">vue</span><pre class="vp-code"><code>${escapeHtml(props.code)}</code></pre></div>`;
});
</script>

<style scoped lang="scss">
.component-doc-demo {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.component-doc-demo__group {
  display: grid;
  gap: 0.75rem;
}

.component-doc-demo__title,
.component-doc-demo__description {
  margin: 0;
}

.component-doc-demo__description {
  color: var(--vp-c-text-2);
  font-size: 0.9375rem;
}

.component-doc-demo__controls {
  display: grid;
  gap: 0.75rem;
}

.component-doc-demo__preview {
  display: flex;
  align-items: center;
  min-height: 180px;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.component-doc-demo__controls :deep(label) {
  display: grid;
  gap: 0.35rem;
  font-size: 0.875rem;
}

.component-doc-demo__controls :deep(input),
.component-doc-demo__controls :deep(select) {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 0.5rem 0.625rem;
  font: inherit;
}
</style>
```

## Fallback Markdown Docs Page

Use this page shape when documenting a component in VitePress and the project has no existing component docs page to follow.

````md
---
title: Example Component
description: Interactive example for the ExampleComponent Vue component.
---

# Example Component

`ExampleComponent` renders a project-local link treatment with a label, destination, and visual variant.

## Props

| Prop      | Type                    | Default     | Notes                                      |
| --------- | ----------------------- | ----------- | ------------------------------------------ |
| `label`   | `string`                | `'Example'` | Text rendered inside the component.        |
| `href`    | `string`                | `'/'`       | Destination applied to the root link.      |
| `variant` | `'default' \| 'subtle'` | `'default'` | Selects the component's visual treatment. |

## Basic Usage

```vue
<ExampleComponent />
<ExampleComponent label="Docs" href="/components/example-component" />
<ExampleComponent label="Subtle" variant="subtle" />
```

## Demo

<script setup>
import { computed, ref } from 'vue';

const label = ref('Example');
const href = ref('/');
const variant = ref('default');

const resolvedLabel = computed(() => {
  const value = label.value?.trim();
  if (!value) return 'Example';
  return value;
});

const resolvedHref = computed(() => {
  const value = href.value?.trim();
  if (!value) return '/';
  return value;
});

function quoteProp(value) {
  return JSON.stringify(value);
}

const demoCode = computed(() => {
  const props = [];

  if (resolvedLabel.value !== 'Example') props.push(`label=${quoteProp(resolvedLabel.value)}`);
  if (resolvedHref.value !== '/') props.push(`href=${quoteProp(resolvedHref.value)}`);
  if (variant.value !== 'default') props.push(`variant=${quoteProp(variant.value)}`);

  if (props.length === 0) return '<ExampleComponent />';
  return `<ExampleComponent\n  ${props.join('\n  ')}\n/>`;
});
</script>

<ComponentDocDemo :code="demoCode">
  <template #controls-description>
    Adjust the controls to update both the live preview and the code sample.
  </template>
  <template #controls>
    <label>
      <span>Label</span>
      <input v-model="label" type="text" placeholder="Example" />
    </label>
    <label>
      <span>Href</span>
      <input v-model="href" type="text" placeholder="/, /components/example-component, https://..." />
    </label>
    <label>
      <span>Variant</span>
      <select v-model="variant">
        <option value="default">default</option>
        <option value="subtle">subtle</option>
      </select>
    </label>
  </template>
  <template #preview>
    <ExampleComponent
      :label="resolvedLabel"
      :href="resolvedHref"
      :variant="variant"
    />
  </template>
</ComponentDocDemo>
````
