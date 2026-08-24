import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };

export const CONTRACT_VERSION = 'tanaab/task-management/v2';
export const FALLBACK_SCHEMA_VERSION = 'tanaab/task-metadata/v2';
export const LEGACY_FALLBACK_SCHEMA_VERSION = 'tanaab/task-metadata/v1';

export const TASK_KINDS = Object.freeze(
  Object.fromEntries(taskManagementSchema.issueTypes.map(({ key, name }) => [key, name])),
);

export const METADATA_DEFINITIONS = Object.freeze({
  type: { fieldName: null, fieldType: 'issue_type', fallbackKey: 'type' },
  ...Object.fromEntries(
    taskManagementSchema.issueFields.map(({ key, name, dataType, fallbackKey }) => [
      key,
      { fieldName: name, fieldType: dataType, fallbackKey },
    ]),
  ),
});

export const FALLBACK_KEY_ORDER = Object.freeze([
  'type',
  'priority',
  'work-size',
  'complexity',
  'impact',
  'start-date',
  'target-date',
]);

function fieldOptions(key) {
  return taskManagementSchema.issueFields.find((field) => field.key === key)?.options ?? [];
}

function normalizedOptions(key) {
  return fieldOptions(key).map((value) => value.toLowerCase().replaceAll(' ', '-'));
}

export const WORK_SIZES = Object.freeze(fieldOptions('workSize').map(Number));
export const PRIORITIES = Object.freeze(normalizedOptions('priority'));
export const COMPLEXITIES = Object.freeze(normalizedOptions('complexity'));
export const IMPACTS = Object.freeze(normalizedOptions('impact'));

export const CANONICAL_LABELS = Object.freeze(
  Object.fromEntries(
    taskManagementSchema.labels.map(({ name, color, description }) => [
      name,
      { color, description },
    ]),
  ),
);

export function displayValue(value) {
  if (value === null || value === undefined) return null;
  return String(value)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
