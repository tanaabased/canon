<template>
  <div class="component-playground" :data-preview-fit="resolvedPreviewFit">
    <div class="component-playground__preview" aria-label="Component preview">
      <component :is="props.component" v-if="hasPreviewSlots" v-bind="previewProps">
        <template v-for="slot in namedPreviewSlots" #[slot.name]>
          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="slot.rendersHtml"
            :key="`${slot.name}-html`"
            class="component-playground__slot-html"
            v-html="slot.value"
          ></div>
          <!-- eslint-enable vue/no-v-html -->
          <template v-else>{{ slot.value }}</template>
        </template>

        <template v-if="defaultRepeatSlot">
          <component
            :is="defaultRepeatSlot.component"
            v-for="item in defaultRepeatSlot.items"
            :key="item.key"
            v-bind="defaultRepeatSlot.props"
          >
            {{ item.label }}
          </component>
        </template>

        <!-- eslint-disable vue/no-v-html -->
        <div
          v-else-if="hasDefaultSlot && rendersDefaultSlotHtml"
          class="component-playground__slot-html"
          v-html="defaultSlotText"
        ></div>
        <!-- eslint-enable vue/no-v-html -->
        <template v-else-if="hasDefaultSlot">{{ defaultSlotText }}</template>
      </component>
      <component :is="props.component" v-else v-bind="previewProps" />
    </div>

    <form v-if="fieldGroups.length > 0" class="component-playground__controls" @submit.prevent>
      <fieldset
        v-for="group in fieldGroups"
        :key="group.name"
        class="component-playground__fieldset"
      >
        <legend>{{ group.label }}</legend>
        <label
          v-for="field in group.fields"
          :key="field.name"
          class="component-playground__field"
        >
          <input
            v-if="field.kind === 'boolean'"
            v-model="field.model[field.name]"
            type="checkbox"
            @change="handleFieldChange(field)"
          />
          <span>{{ field.label }}</span>
          <select
            v-if="field.kind === 'enum'"
            v-model="field.model[field.name]"
            @change="handleFieldChange(field)"
          >
            <option v-for="option in field.options" :key="option" :value="option">
              {{ option === '' ? "''" : option }}
            </option>
          </select>
          <textarea
            v-else-if="field.multiline"
            v-model="field.model[field.name]"
            @input="handleFieldChange(field)"
          ></textarea>
          <input
            v-else-if="field.kind !== 'boolean'"
            v-model="field.model[field.name]"
            :type="field.kind === 'number' ? 'number' : 'text'"
            @input="handleFieldChange(field)"
          />
        </label>
      </fieldset>
    </form>

    <div class="component-playground__code language-html vp-adaptive-theme">
      <button
        class="copy"
        type="button"
        :aria-label="copyLabel"
        :title="copyLabel"
        @click="copyCode"
      ></button>
      <span class="lang">html</span>
      <pre class="vp-code"><code>{{ generated.code }}</code></pre>
    </div>

    <div class="component-playground__actions">
      <a
        v-if="resolvedSourceHref"
        :href="resolvedSourceHref"
        target="_blank"
        rel="noreferrer"
        aria-label="View component source"
      >
        source
      </a>
      <button type="button" @click="resetPlayground">reset</button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useData } from 'vitepress';

import {
  applyControlDerivedProps,
  createPlaygroundState,
  generateComponentUsage,
  getPreviewProps,
  getRepeatSlotItems,
} from './component-playground-codegen.js';

const props = defineProps({
  component: {
    type: [Object, String, Function],
    required: true,
  },
  schema: {
    type: Object,
    required: true,
  },
  source: {
    type: [Boolean, String],
    default: true,
  },
  initialState: {
    type: Object,
    default: () => ({}),
  },
  previewFit: {
    type: String,
    default: 'full',
  },
});

const emit = defineEmits(['copy', 'update:state']);

const { page, theme } = useData();
const copied = ref(false);
const state = reactive(createPlaygroundState(props.schema, props.initialState));

const generated = computed(() => generateComponentUsage(props.schema, state));
const previewProps = computed(() => getPreviewProps(props.schema, state));
const resolvedPreviewFit = computed(() => (props.previewFit === 'contained' ? 'contained' : 'full'));
const slotDefinitions = computed(() => Object.entries(props.schema?.slots ?? {}));
const namedPreviewSlots = computed(() => {
  return slotDefinitions.value
    .filter(([slotName, definition]) => slotName !== 'default' && definition.kind !== 'repeat')
    .map(([name, definition]) => ({
      name,
      rendersHtml: definition.kind === 'html',
      value: state.slots[name] ?? '',
    }));
});
const defaultSlotDefinition = computed(() => props.schema?.slots?.default ?? null);
const defaultRepeatSlotDefinition = computed(() => {
  return defaultSlotDefinition.value?.kind === 'repeat' ? defaultSlotDefinition.value : null;
});
const defaultSlotText = computed(() => state.slots.default ?? '');
const hasDefaultSlot = computed(() => Boolean(defaultSlotDefinition.value));
const rendersDefaultSlotHtml = computed(() => defaultSlotDefinition.value?.kind === 'html');
const defaultRepeatSlot = computed(() => {
  const definition = defaultRepeatSlotDefinition.value;
  if (!definition) return null;

  return {
    component: definition.component,
    props: definition.props ?? {},
    items: getRepeatSlotItems(definition, state),
  };
});
const hasPreviewSlots = computed(() => {
  return (
    namedPreviewSlots.value.length > 0 || Boolean(defaultRepeatSlot.value) || hasDefaultSlot.value
  );
});
const copyLabel = computed(() => (copied.value ? 'Copied code' : 'Copy code'));
const fieldGroups = computed(() => {
  const groups = [];
  const controls = createFields('controls', 'Controls', props.schema?.controls, state.controls);
  const componentProps = createFields('props', 'Props', props.schema?.props, state.props);
  const slots = createFields('slots', 'Slots', props.schema?.slots, state.slots);

  if (controls.fields.length > 0) groups.push(controls);
  if (componentProps.fields.length > 0) groups.push(componentProps);
  if (slots.fields.length > 0) groups.push(slots);

  return groups;
});

function createFields(name, label, definitions = {}, model) {
  return {
    name,
    label,
    fields: Object.entries(definitions)
      .filter(([, definition]) => definition.kind !== 'object-array' && definition.kind !== 'repeat')
      .map(([fieldName, definition]) => ({
        name: fieldName,
        label: definition.label ?? fieldName,
        kind: definition.kind ?? 'string',
        multiline: name === 'slots' || definition.kind === 'html',
        options: definition.options ?? [],
        model,
      })),
  };
}

function replaceReactiveObject(target, source) {
  for (const key of Object.keys(target)) {
    delete target[key];
  }

  Object.assign(target, source);
}

function replacePlaygroundState(nextState) {
  replaceReactiveObject(state.controls, nextState.controls);
  replaceReactiveObject(state.props, nextState.props);
  replaceReactiveObject(state.slots, nextState.slots);
}

function resetPlayground() {
  replacePlaygroundState(createPlaygroundState(props.schema, props.initialState));
}

watch(
  () => [props.schema, props.initialState],
  () => {
    resetPlayground();
  },
  { deep: true },
);

watch(
  state,
  () => {
    emit('update:state', {
      controls: { ...state.controls },
      props: { ...state.props },
      slots: { ...state.slots },
    });
  },
  { deep: true },
);

function handleFieldChange(field) {
  if (field.kind === 'number') {
    const value = Number(field.model[field.name]);
    field.model[field.name] = Number.isFinite(value) ? value : 0;
  }

  if (field.model === state.controls) {
    applyControlDerivedProps(props.schema, state, field.name);
  }
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

async function copyCode(event) {
  event?.preventDefault();
  await navigator.clipboard.writeText(generated.value.copyCode);
  copied.value = true;
  emit('copy', generated.value.copyCode);

  window.setTimeout(() => {
    copied.value = false;
  }, 1400);
}
</script>

<style scoped lang="scss">
.component-playground {
  display: grid;
  gap: 1rem;
}

.component-playground__controls,
.component-playground__fieldset {
  display: grid;
  gap: 0.75rem;
}

.component-playground[data-preview-fit='contained'] .component-playground__preview {
  max-inline-size: min(100%, 24rem);
}

.component-playground__field {
  display: grid;
  gap: 0.25rem;
}

.component-playground__actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
</style>
