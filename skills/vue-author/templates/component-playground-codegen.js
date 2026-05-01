function toKebabCase(value) {
  return String(value ?? '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function escapeAttributeValue(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeSlotText(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeJsStringValue(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'");
}

function cloneValue(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function getDefaultValue(definition = {}) {
  if ('default' in definition) return cloneValue(definition.default);
  if (definition.kind === 'boolean') return false;
  if (definition.kind === 'number') return 0;
  if (definition.kind === 'object-array') return [];
  return '';
}

function getSchemaControls(schema) {
  return Object.entries(schema?.controls ?? {});
}

function getSchemaProps(schema) {
  return Object.entries(schema?.props ?? {});
}

function getSchemaSlots(schema) {
  return Object.entries(schema?.slots ?? {});
}

function getPathParts(path) {
  return String(path ?? '')
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
}

function getNestedValue(source, path) {
  return getPathParts(path).reduce((value, part) => value?.[part], source);
}

function getObjectArrayPresetItems(definition, state) {
  if (definition?.kind !== 'object-array' || !definition.presets) return null;

  const presetName = definition.presetControl
    ? state.controls?.[definition.presetControl]
    : definition.defaultPreset;
  const presets = definition.presets ?? {};
  const items = Array.isArray(presets[presetName])
    ? presets[presetName]
    : Array.isArray(definition.default)
      ? definition.default
      : [];
  const countValue = definition.countControl
    ? state.controls?.[definition.countControl]
    : definition.defaultCount;
  const count = Number(countValue ?? items.length);
  const resolvedCount = Number.isInteger(count) && count >= 0 ? count : items.length;

  return cloneValue(items.slice(0, Math.min(resolvedCount, items.length)));
}

export function applyControlDerivedProps(schema, state, changedControl) {
  for (const [name, definition] of getSchemaProps(schema)) {
    if (definition.kind !== 'object-array') continue;
    if (!definition.presets) continue;
    if (
      changedControl &&
      changedControl !== definition.presetControl &&
      changedControl !== definition.countControl
    ) {
      continue;
    }

    const items = getObjectArrayPresetItems(definition, state);
    if (items) state.props[name] = items;
  }
}

export function createPlaygroundState(schema, initialState = {}) {
  const state = {
    controls: {},
    props: {},
    slots: {},
  };

  for (const [name, definition] of getSchemaControls(schema)) {
    state.controls[name] = cloneValue(initialState.controls?.[name] ?? getDefaultValue(definition));
  }

  for (const [name, definition] of getSchemaProps(schema)) {
    state.props[name] = cloneValue(initialState.props?.[name] ?? getDefaultValue(definition));
  }

  for (const [name, definition] of getSchemaSlots(schema)) {
    state.slots[name] = cloneValue(initialState.slots?.[name] ?? definition.default ?? '');
  }

  applyControlDerivedProps(schema, state);

  return state;
}

export function setNestedValue(source, path, value) {
  const parts = getPathParts(path);
  if (parts.length === 0) return source;

  let target = source;

  for (const part of parts.slice(0, -1)) {
    if (!target[part] || typeof target[part] !== 'object' || Array.isArray(target[part])) {
      target[part] = {};
    }

    target = target[part];
  }

  target[parts.at(-1)] = value;

  return source;
}

function isDefaultValue(value, definition) {
  if (!('default' in definition)) return false;
  return JSON.stringify(value) === JSON.stringify(definition.default);
}

function shouldRenderObjectArrayField(field, value) {
  if (!field.optional) return true;
  return value !== undefined && value !== null && value !== '';
}

function formatObjectKey(key) {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}

function formatJsValue(value, indent = 0) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => formatJsValue(item, indent)).join(', ')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';

    const innerIndent = ' '.repeat(indent + 2);
    const closingIndent = ' '.repeat(indent);
    const body = entries
      .map(([key, item]) => {
        return `${innerIndent}${formatObjectKey(key)}: ${formatJsValue(item, indent + 2)},`;
      })
      .join('\n');

    return `{\n${body}\n${closingIndent}}`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return `'${escapeJsStringValue(value)}'`;
}

function appendObjectArrayProp(code, name, definition, value) {
  const items = Array.isArray(value) ? value : [];
  const fields = Array.isArray(definition.fields) ? definition.fields : [];

  if (items.length === 0 && isDefaultValue(items, definition)) return { code, rendered: false };

  code += `:${toKebabCase(name)}="[`;

  items.forEach((item) => {
    const renderedItem = {};

    for (const field of fields) {
      const fieldValue = getNestedValue(item, field.path);
      if (!shouldRenderObjectArrayField(field, fieldValue)) continue;
      setNestedValue(renderedItem, field.path, fieldValue);
    }

    if (Object.keys(renderedItem).length === 0) return;

    code += `\n    ${formatJsValue(renderedItem, 4)},`;
  });

  code += '\n  ]"';

  return { code, rendered: true };
}

function appendProp(code, name, definition, value) {
  if (definition.kind === 'object-array') {
    return appendObjectArrayProp(code, name, definition, value);
  }

  if (definition.kind === 'boolean') {
    if (!value) return { code, rendered: false };
    return { code: code + toKebabCase(name), rendered: true };
  }

  if (value === undefined || value === null || value === '') return { code, rendered: false };
  if (isDefaultValue(value, definition)) return { code, rendered: false };

  if (definition.kind === 'number') {
    const numberValue = Number(value);
    return {
      code: `${code}:${toKebabCase(name)}="${Number.isFinite(numberValue) ? numberValue : 0}"`,
      rendered: true,
    };
  }

  return {
    code: `${code}${toKebabCase(name)}="${escapeAttributeValue(value)}"`,
    rendered: true,
  };
}

function formatSlotValue(definition, value) {
  return definition.kind === 'html' ? String(value ?? '') : escapeSlotText(value ?? '');
}

function formatChildProps(props = {}) {
  const attributes = [];

  for (const [name, value] of Object.entries(props)) {
    if (typeof value === 'boolean') {
      if (value) attributes.push(toKebabCase(name));
      continue;
    }

    if (value === undefined || value === null || value === '') continue;
    attributes.push(`${toKebabCase(name)}="${escapeAttributeValue(value)}"`);
  }

  return attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
}

function resolveRepeatCount(definition, state) {
  const controlValue = definition.countControl ? state.controls?.[definition.countControl] : undefined;

  if (controlValue === 'auto') {
    const autoValue = Number(state.props?.[definition.autoCountProp]);
    if (Number.isInteger(autoValue) && autoValue > 0) return autoValue;
  }

  const explicitValue = Number(controlValue);
  if (Number.isInteger(explicitValue) && explicitValue >= 0) return explicitValue;

  const defaultCount = Number(definition.defaultCount);
  if (Number.isInteger(defaultCount) && defaultCount >= 0) return defaultCount;

  return definition.items?.length ?? 0;
}

export function getRepeatSlotItems(definition, state) {
  if (definition?.kind !== 'repeat') return [];

  const items = Array.isArray(definition.items) ? definition.items : [];
  const count = Math.min(resolveRepeatCount(definition, state), items.length);

  return items.slice(0, count).map((item, index) => ({
    key: `${index}-${item}`,
    label: String(item ?? ''),
  }));
}

function appendSlot(code, slotName, definition, state) {
  if (definition.kind === 'repeat') {
    const childName = definition.componentName ?? 'Component';
    const childProps = formatChildProps(definition.props);

    for (const item of getRepeatSlotItems(definition, state)) {
      code += `\n  <${childName}${childProps}>${escapeSlotText(item.label)}</${childName}>`;
    }

    return code;
  }

  const value = formatSlotValue(definition, state.slots[slotName]);

  if (slotName === 'default') {
    return `${code}\n  ${value}`;
  }

  return `${code}\n  <template #${slotName}>\n    ${value}\n  </template>`;
}

export function generateComponentUsage(schema, state) {
  const name = schema?.name ?? 'Component';
  const props = getSchemaProps(schema);
  const slots = getSchemaSlots(schema);
  let code = `<${name}`;
  let renderedPropCount = 0;

  for (const [propName, definition] of props) {
    const before = code.length;
    code += '\n  ';
    const result = appendProp(code, propName, definition, state.props[propName]);
    code = result.code;

    if (!result.rendered) {
      code = code.slice(0, before);
    } else {
      renderedPropCount += 1;
    }
  }

  if (slots.length === 0) {
    code += renderedPropCount > 0 ? '\n/>' : ' />';
    return { code, copyCode: code };
  }

  code += '>';

  for (const [slotName, definition] of slots.filter(([name]) => name !== 'default')) {
    code = appendSlot(code, slotName, definition, state);
  }

  const defaultSlot = slots.find(([slotName]) => slotName === 'default');
  if (defaultSlot) {
    code = appendSlot(code, defaultSlot[0], defaultSlot[1], state);
  }

  code += `\n</${name}>`;

  return { code, copyCode: code };
}

export function getPreviewProps(schema, state) {
  const previewProps = {};

  for (const [name, definition] of getSchemaProps(schema)) {
    const value = state.props[name] ?? getDefaultValue(definition);

    if (definition.kind === 'boolean' && !value) continue;
    previewProps[name] = value;
  }

  return previewProps;
}
