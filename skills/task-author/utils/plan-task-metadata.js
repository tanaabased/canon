import { METADATA_DEFINITIONS, TASK_KINDS, displayValue } from '../lib/task-author-contract.js';

function normalizeFieldType(field) {
  return String(field.data_type ?? field.type ?? field.field_type ?? '')
    .toLowerCase()
    .replaceAll('-', '_');
}

function fieldOptions(field) {
  return field.options ?? field.settings?.options ?? [];
}

function findNamed(values, name) {
  return values.find((value) => String(value.name).toLowerCase() === name.toLowerCase());
}

/** Plan native versus fallback storage from observed GitHub capabilities. */
export function planTaskMetadata(kind, values = {}, capabilities = {}) {
  const native = { type: null, fields: [] };
  const fallback = {};
  const unresolved = [];
  const warnings = [];

  if (kind) {
    const kindDisplay = TASK_KINDS[kind];
    if (capabilities.issueTypes?.status === 'ok') {
      const issueType = findNamed(capabilities.issueTypes.values ?? [], kindDisplay);
      if (issueType) native.type = { id: issueType.id ?? null, name: issueType.name };
      else fallback.type = kind;
    } else if (capabilities.issueTypes?.status === 'not_applicable') {
      fallback.type = kind;
    } else {
      unresolved.push({ key: 'type', value: kind, reason: 'issue type availability is unknown' });
    }
  }

  for (const [key, definition] of Object.entries(METADATA_DEFINITIONS)) {
    if (key === 'type' || values[key] === undefined) continue;
    const value = values[key];
    const status = capabilities.issueFields?.status;

    if (status === 'not_applicable') {
      fallback[definition.fallbackKey] = value;
      continue;
    }
    if (status !== 'ok') {
      unresolved.push({
        key: definition.fallbackKey,
        value,
        reason: 'issue field availability is unknown',
      });
      continue;
    }

    const field = findNamed(capabilities.issueFields.values ?? [], definition.fieldName);
    if (!field) {
      fallback[definition.fallbackKey] = value;
      continue;
    }

    if (normalizeFieldType(field) !== definition.fieldType) {
      fallback[definition.fallbackKey] = value;
      warnings.push(
        `${definition.fieldName} has incompatible type ${normalizeFieldType(field) || 'unknown'}; using fallback metadata.`,
      );
      continue;
    }

    let nativeValue = value;
    if (definition.fieldType === 'single_select') {
      const option = findNamed(fieldOptions(field), displayValue(value));
      if (!option) {
        fallback[definition.fallbackKey] = value;
        warnings.push(
          `${definition.fieldName} lacks option ${displayValue(value)}; using fallback metadata.`,
        );
        continue;
      }
      nativeValue = { id: option.id ?? null, name: option.name };
    }

    native.fields.push({
      id: field.id ?? null,
      name: field.name,
      type: definition.fieldType,
      value: nativeValue,
    });
  }

  return { native, fallback, unresolved, warnings };
}
