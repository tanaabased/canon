import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };

export const REPOSITORY_MODES = Object.freeze(['organization', 'personal']);

export const TASK_KINDS = Object.freeze(
  Object.fromEntries(taskManagementSchema.issueTypes.map(({ key, name }) => [key, { key, name }])),
);

export function issueFormName(kind) {
  if (!TASK_KINDS[kind]) throw new Error(`Unsupported task kind: ${kind}`);
  return kind === 'bug' ? 'Bug report' : TASK_KINDS[kind].name;
}

export const BODY_SHAPES = Object.freeze(taskManagementSchema.bodyShapes);
export const SCORING_DIAGNOSTICS = Object.freeze(taskManagementSchema.scoringDiagnostics);

export const LIST_SECTION_KEYS = Object.freeze(
  new Set(['inScope', 'outOfScope', 'acceptanceCriteria']),
);

export const PERSONAL_METADATA_FIELDS = Object.freeze([
  {
    id: 'priority',
    key: 'priority',
    label: 'Priority estimate',
    type: 'dropdown',
    options: ['Urgent', 'High', 'Medium', 'Low'],
  },
  {
    id: 'work-size',
    key: 'workSize',
    label: 'Work size estimate',
    type: 'dropdown',
    options: ['1', '2', '3', '5', '8', '13', '21'],
  },
  {
    id: 'complexity',
    key: 'complexity',
    label: 'Complexity estimate',
    type: 'dropdown',
    options: ['Low', 'Medium', 'High'],
  },
  {
    id: 'impact',
    key: 'impact',
    label: 'Impact estimate',
    type: 'dropdown',
    options: ['Low', 'Medium', 'High', 'Very high'],
  },
  { id: 'start-date', key: 'startDate', label: 'Start date', type: 'input' },
  { id: 'target-date', key: 'targetDate', label: 'Target date', type: 'input' },
]);

const RESERVED_SCORING_OPTION_REPLACEMENTS = Object.freeze({
  urgency: Object.freeze({ none: 'Not time-sensitive' }),
  enablement: Object.freeze({ none: 'No enabling effect' }),
});

function normalizedChoice(value) {
  return String(value).trim().toLowerCase().replaceAll(' ', '-');
}

export function scoringFormOption(key, value) {
  const canonical = normalizedChoice(value);
  return RESERVED_SCORING_OPTION_REPLACEMENTS[key]?.[canonical] ?? displayValue(canonical);
}

export function scoringCanonicalValue(key, value) {
  const submitted = normalizedChoice(value);
  const replacement = Object.entries(RESERVED_SCORING_OPTION_REPLACEMENTS[key] ?? {}).find(
    ([, display]) => normalizedChoice(display) === submitted,
  );
  return replacement?.[0] ?? submitted;
}

export const SIGNAL_OPTIONS = Object.freeze([
  { kinds: ['task'], label: 'Documentation work', signal: 'documentation' },
  { kinds: ['feature'], label: 'Breaking change', signal: 'breakingChange' },
  { kinds: ['bug'], label: 'Regression from previously working behavior', signal: 'regression' },
  {
    kinds: ['task', 'bug', 'feature'],
    label: 'Maintainers welcome outside contributions',
    signal: 'helpWanted',
  },
  {
    kinds: ['task', 'feature'],
    label: 'Suitable for a first contribution',
    signal: 'goodFirstIssue',
  },
  {
    kinds: ['task', 'bug', 'feature'],
    label: 'Blocked by an external dependency',
    relationship: 'externalBlocker',
  },
]);

const SECTION_PROMPTS = Object.freeze({
  context:
    'Describe the current situation, who is affected, recurring value or cost, urgency, work enabled, and meaningful uncertainty.',
  objective: 'State one observable outcome this task should produce.',
  inScope: 'List the concrete behavior or surfaces this task includes, one item per line.',
  outOfScope: 'List adjacent work this task deliberately excludes, one item per line.',
  acceptanceCriteria: 'List observable completion conditions, one item per line.',
  constraints: 'Record known constraints, dependencies, evidence, or implementation notes.',
  observedBehavior:
    'Describe what happens now, including affected versions, frequency, and blast radius when known.',
  expectedBehavior: 'Describe the behavior that should occur instead.',
  reproduction:
    'Provide reproducible steps or other direct evidence. Include commands, versions, and outputs when useful.',
  impactSummary:
    'Explain affected users or workflows, frequency, severity, urgency, and whether other work is blocked.',
  problem:
    'Describe the capability gap or opportunity, affected users, recurring value, urgency, and work this could enable.',
  desiredOutcome:
    'Describe the supported outcome without prescribing unnecessary implementation detail.',
  alternatives:
    'Record meaningful alternatives, compatibility requirements, and other constraints.',
});

export function sectionPrompt(key) {
  return SECTION_PROMPTS[key] ?? 'Provide the evidence needed for this section.';
}

export function formId(key) {
  return String(key).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function displayValue(value) {
  return String(value)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
