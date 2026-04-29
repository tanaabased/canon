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
