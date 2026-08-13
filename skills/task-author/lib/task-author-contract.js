export const CONTRACT_VERSION = 'tanaab/task-management/v1';
export const FALLBACK_SCHEMA_VERSION = 'tanaab/task-metadata/v1';
export const SCORE_FORMULA_VERSION = 'task-score/v1';

export const TASK_KINDS = Object.freeze({
  task: 'Task',
  bug: 'Bug',
  feature: 'Feature',
});

export const METADATA_DEFINITIONS = Object.freeze({
  type: { fieldName: null, fieldType: 'issue_type', fallbackKey: 'type' },
  priority: {
    fieldName: 'Priority',
    fieldType: 'single_select',
    fallbackKey: 'priority',
  },
  workSize: {
    fieldName: 'Work size',
    fieldType: 'single_select',
    fallbackKey: 'work-size',
  },
  complexity: {
    fieldName: 'Complexity',
    fieldType: 'single_select',
    fallbackKey: 'complexity',
  },
  impact: {
    fieldName: 'Impact',
    fieldType: 'single_select',
    fallbackKey: 'impact',
  },
  taskScore: {
    fieldName: 'Task score',
    fieldType: 'number',
    fallbackKey: 'task-score',
  },
  startDate: {
    fieldName: 'Start date',
    fieldType: 'date',
    fallbackKey: 'start-date',
  },
  targetDate: {
    fieldName: 'Target date',
    fieldType: 'date',
    fallbackKey: 'target-date',
  },
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

export const CANONICAL_LABELS = Object.freeze({
  documentation: {
    color: '2f81f7',
    description: 'Documentation additions or improvements',
  },
  'breaking change': {
    color: 'db2777',
    description: 'Requires consumer migration or coordination',
  },
  regression: {
    color: 'e5484d',
    description: 'Previously working behavior has degraded',
  },
  blocked: {
    color: '7f1d1d',
    description: 'Cannot proceed because of a documented blocker',
  },
  'needs triage': {
    color: 'f59e0b',
    description: 'Submitted but not yet normalized against the task contract',
  },
  'needs reproduction': {
    color: 'f97316',
    description: 'A Bug needs reproducible evidence before work can proceed',
  },
  'good first issue': {
    color: '86e7c4',
    description: 'Well-bounded work suitable for a first contribution',
  },
  'help wanted': {
    color: '00c88a',
    description: 'Maintainers welcome outside contribution',
  },
});

export function displayValue(value) {
  if (value === null || value === undefined) return null;
  return String(value)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
