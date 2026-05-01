---
title: Example Component
description: Interactive example for the ExampleComponent Vue component.
---

# Example Component

`ExampleComponent` renders a project-local content block with title, body, and optional action content.

<script setup>
import ComponentPlayground from './component-playground.vue';
import ExampleComponent from './example-component.vue';

const examplePlaygroundSchema = {
  name: 'ExampleComponent',
  props: {
    description: {
      kind: 'string',
      default: 'Example component body.',
    },
    framed: {
      kind: 'boolean',
      default: false,
    },
    title: {
      kind: 'string',
      default: 'Example component',
    },
    variant: {
      kind: 'enum',
      options: ['default', 'subtle'],
      default: 'default',
    },
  },
  slots: {
    title: {
      kind: 'text',
      default: 'Docs example',
    },
    default: {
      kind: 'text',
      default: 'Body content can come from the default slot.',
    },
    actions: {
      kind: 'html',
      default: '<a href="/components/">Component index</a>',
    },
  },
};
</script>

## Usage

<ComponentPlayground :component="ExampleComponent" :schema="examplePlaygroundSchema" />

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

The Usage playground combines the representative live preview and generated `html` usage example. Boolean props render as presence attributes when enabled.
