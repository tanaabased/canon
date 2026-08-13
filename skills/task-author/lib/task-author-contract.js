import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };

export const CONTRACT_VERSION = 'tanaab/task-management/v1';
export const FALLBACK_SCHEMA_VERSION = 'tanaab/task-metadata/v1';
export const SCORE_FORMULA_VERSION = 'task-score/v1';

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
  'task-score',
  'start-date',
  'target-date',
]);

export const WORK_SIZES = Object.freeze([1, 2, 3, 5, 8, 13, 21]);
export const PRIORITIES = Object.freeze(['urgent', 'high', 'medium', 'low']);
export const COMPLEXITIES = Object.freeze(['low', 'medium', 'high']);
export const IMPACTS = Object.freeze(['low', 'medium', 'high', 'very-high']);

export const SCORE_FACTORS = Object.freeze({
  impact: { low: 0.25, medium: 0.5, high: 0.75, 'very-high': 1 },
  urgency: { none: 0, moderate: 0.33, high: 0.67, immediate: 1 },
  enablement: { none: 0, some: 0.33, substantial: 0.67, foundational: 1 },
  confidence: { low: 0.5, medium: 0.75, high: 1 },
});

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
