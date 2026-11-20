# Vue component starter

Use this fallback when the project has no established component example. Keep the public props and slots aligned with the companion documentation and tests. Adapt their names, defaults, markup and styles to the component.

Destination: `example-component.vue`.

```vue
<template>
  <section class="example-component" :data-framed="props.framed" :data-variant="props.variant">
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
