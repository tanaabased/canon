import {
  METADATA_DEFINITIONS,
  TASK_KINDS,
  displayValue,
} from '../../../lib/task-management-contract.js';

function normalizeFieldType(field) {
  return String(field.data_type ?? field.type ?? field.field_type ?? '')
    .toLowerCase()
    .replaceAll('-', '_');
}

function findNamed(values, name) {
  return values.find((value) => String(value.name).toLowerCase() === name.toLowerCase());
}

export function findEnabledIssueType(capabilities, name) {
  return findNamed(
    (capabilities.issueTypes?.values ?? []).filter(({ is_enabled }) => is_enabled !== false),
    name,
  );
}

/** Plan native versus fallback storage from observed GitHub capabilities. */
export function planTaskMetadata(
  kind,
  values = {},
  capabilities = {},
  { forceFallbackKeys = [] } = {},
) {
  const native = { type: null, fields: [] };
  const fallback = {};
  const unresolved = [];
  const warnings = [];
  const forced = new Set(forceFallbackKeys);

  if (kind) {
    const kindDisplay = TASK_KINDS[kind];
    if (forced.has('type')) {
      fallback.type = kind;
    } else if (capabilities.issueTypes?.status === 'ok') {
      const issueType = findEnabledIssueType(capabilities, kindDisplay);
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

    if (forced.has(definition.fallbackKey)) {
      fallback[definition.fallbackKey] = value;
      continue;
    }

    if (status === 'not_applicable') {
      fallback[definition.fallbackKey] = value;
      continue;
    }
    const field =
      status === 'ok' && findNamed(capabilities.issueFields.values ?? [], definition.fieldName);
    if (status !== 'ok' || (!field && capabilities.issueFields.complete === false)) {
      unresolved.push({
        key: definition.fallbackKey,
        value,
        reason: 'issue field availability is unknown',
      });
      continue;
    }

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
    if (!Number.isSafeInteger(Number(field.id)) || Number(field.id) <= 0) {
      unresolved.push({
        key: definition.fallbackKey,
        value,
        reason: 'issue field ID is unavailable',
      });
      continue;
    }
    if (definition.fieldType === 'single_select') {
      const options = field.options ?? field.settings?.options;
      if (!Array.isArray(options) || options.some((option) => !option?.name)) {
        unresolved.push({
          key: definition.fallbackKey,
          value,
          reason: 'issue field options are unavailable',
        });
        continue;
      }
      const option = findNamed(options, displayValue(value));
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
