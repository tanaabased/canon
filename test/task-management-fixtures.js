import taskManagementSchema from '../references/task-management-schema.json' with { type: 'json' };

const CANONICAL_LABEL_NAMES = Object.freeze(taskManagementSchema.labels.map(({ name }) => name));

export const completeTaskSections = Object.freeze({
  context: 'Release checks are repeated manually.',
  objective: 'Provide one consolidated repository health summary.',
  inScope: ['Existing repository health checks'],
  outOfScope: ['Automatic remediation'],
  acceptanceCriteria: ['The summary reports every supported check', 'Validation passes'],
});

export const completeBugSections = Object.freeze({
  observedBehavior: 'The current release omits stale plugin files during cache refresh.',
  expectedBehavior: 'Stale plugin files are removed.',
  reproduction: 'Run the refresh twice and inspect the installed cache.',
  impactSummary: 'The release workflow retains incorrect output.',
  acceptanceCriteria: ['A refresh removes every stale plugin file'],
});

export const completeFeatureSections = Object.freeze({
  problem: 'Automation lacks a stable machine-readable task inspection surface.',
  desiredOutcome: 'Expose a supported task inspection JSON contract.',
  inScope: ['One versioned JSON schema'],
  outOfScope: ['Unrelated CLI redesign'],
  acceptanceCriteria: ['The schema is documented', 'Migration evidence is recorded'],
  alternatives: 'The experimental output shape is not retained because it is ambiguous.',
});

function singleSelect(id, name, options) {
  return {
    id,
    name,
    data_type: 'single_select',
    options: options.map((option, index) => ({ id: `${id}-${index}`, name: option })),
  };
}

function schemaField(id, key) {
  const field = taskManagementSchema.issueFields.find((candidate) => candidate.key === key);
  return field.dataType === 'single_select'
    ? singleSelect(id, field.name, field.options)
    : { id, name: field.name, data_type: field.dataType };
}

export function organizationCapabilities({ partial = false } = {}) {
  const fields = [
    schemaField(101, 'priority'),
    schemaField(102, 'workSize'),
    schemaField(103, 'startDate'),
    schemaField(104, 'targetDate'),
  ];
  if (!partial) {
    fields.push(
      schemaField(105, 'complexity'),
      schemaField(106, 'impact'),
      schemaField(107, 'taskScore'),
    );
  }

  return {
    repository: {
      slug: 'acme/widgets',
      ownerLogin: 'acme',
      ownerType: 'Organization',
      private: false,
    },
    issueTypes: {
      status: 'ok',
      values: [
        { id: 1, name: 'Task' },
        { id: 2, name: 'Bug' },
        { id: 3, name: 'Feature' },
      ],
    },
    issueFields: { status: 'ok', values: fields },
    labels: {
      status: 'ok',
      values: CANONICAL_LABEL_NAMES.map((name) => ({ name })),
    },
    warnings: [],
  };
}

export function personalCapabilities() {
  return {
    repository: {
      slug: 'octo-user/widgets',
      ownerLogin: 'octo-user',
      ownerType: 'User',
      private: false,
    },
    issueTypes: { status: 'not_applicable', values: [] },
    issueFields: { status: 'not_applicable', values: [] },
    labels: {
      status: 'ok',
      values: CANONICAL_LABEL_NAMES.map((name) => ({ name })),
    },
    warnings: [],
  };
}

export function fakeClient(capabilities, { resolvedTarget = null } = {}) {
  const calls = [];
  return {
    calls,
    ensureAvailable() {
      calls.push('ensureAvailable');
      return [];
    },
    resolveCurrentRepository() {
      calls.push('resolveCurrentRepository');
      return resolvedTarget;
    },
    inspectRepository(target) {
      calls.push(`inspectRepository:${target.slug}`);
      return capabilities;
    },
  };
}

function assessed(input, overrides = {}) {
  const assessment = {};
  const humanControlled = new Set(['priority', 'startDate', 'targetDate']);
  for (const [key, value] of Object.entries(input.metadata ?? {})) {
    const source = humanControlled.has(key) ? 'human' : 'agent';
    assessment[key] = {
      source,
      rationale:
        source === 'human'
          ? `A human supplied ${key} as ${value}.`
          : `The described evidence supports ${key} as ${value}.`,
    };
  }
  for (const [key, value] of Object.entries(input.scoring ?? {})) {
    assessment[key] = {
      source: 'agent',
      rationale: `The described evidence supports ${key} as ${value}.`,
    };
  }
  return { ...input, assessment: { ...assessment, ...overrides } };
}

const fixtures = [
  {
    id: 'T01',
    capabilities: organizationCapabilities(),
    input: assessed({
      target: 'acme/widgets',
      title: 'add a repository health summary',
      kind: 'Task',
      sections: completeTaskSections,
      metadata: { priority: 'medium', workSize: 3, complexity: 'low', impact: 'medium' },
      scoring: { urgency: 'moderate', enablement: 'some', confidence: 'high' },
    }),
    expected: { score: 37, nativeFields: 5, fallback: {}, labels: [] },
  },
  {
    id: 'T02',
    capabilities: organizationCapabilities(),
    input: assessed({
      target: 'acme/widgets',
      title: 'remove stale plugin files during cache refresh',
      kind: 'Bug',
      sections: completeBugSections,
      metadata: { priority: 'high', workSize: 5, complexity: 'medium', impact: 'high' },
      scoring: { urgency: 'high', enablement: 'none', confidence: 'high' },
      signals: { regression: true },
      reproductionAvailable: true,
    }),
    expected: { score: 47, nativeFields: 5, fallback: {}, labels: ['regression'] },
  },
  {
    id: 'T03',
    capabilities: organizationCapabilities(),
    input: assessed({
      target: 'acme/widgets',
      title: 'add machine-readable task inspection',
      kind: 'Feature',
      sections: completeFeatureSections,
      metadata: {
        priority: 'medium',
        workSize: 8,
        complexity: 'high',
        impact: 'high',
        targetDate: '2026-10-01',
      },
      scoring: { urgency: 'moderate', enablement: 'substantial', confidence: 'medium' },
      signals: { breakingChange: true },
    }),
    expected: { score: 37, nativeFields: 6, fallback: {}, labels: ['breaking change'] },
  },
  {
    id: 'T04',
    capabilities: personalCapabilities(),
    input: assessed({
      target: 'octo-user/widgets',
      title: 'document local setup prerequisites',
      kind: 'Task',
      sections: completeTaskSections,
      metadata: { priority: 'low', workSize: 2, complexity: 'low', impact: 'low' },
      scoring: { urgency: 'none', enablement: 'some', confidence: 'high' },
      signals: { documentation: true },
    }),
    expected: {
      score: 20,
      nativeFields: 0,
      fallback: {
        type: 'task',
        priority: 'low',
        'work-size': 2,
        complexity: 'low',
        impact: 'low',
        'task-score': 20,
      },
      labels: ['documentation'],
    },
  },
  {
    id: 'T05',
    capabilities: personalCapabilities(),
    input: assessed({
      target: 'octo-user/widgets',
      title: 'avoid duplicate retry output',
      kind: 'Bug',
      sections: completeBugSections,
      metadata: { priority: 'high', workSize: 3, complexity: 'medium', impact: 'high' },
      scoring: { urgency: 'high', enablement: 'none', confidence: 'high' },
      signals: { regression: true },
      reproductionAvailable: true,
    }),
    expected: { score: 50, nativeFields: 0, labels: ['regression'] },
  },
  {
    id: 'T06',
    capabilities: personalCapabilities(),
    input: assessed({
      target: 'octo-user/widgets',
      title: 'export a task summary',
      kind: 'Feature',
      sections: completeFeatureSections,
      metadata: { priority: 'medium', workSize: 5, complexity: 'medium', impact: 'high' },
      scoring: { urgency: 'moderate', enablement: 'substantial', confidence: 'high' },
      signals: { helpWanted: true, goodFirstIssue: true },
    }),
    expected: { score: 52, nativeFields: 0, labels: ['help wanted'] },
  },
  {
    id: 'T09',
    capabilities: organizationCapabilities(),
    input: assessed({
      target: 'acme/widgets',
      title: 'integrate the vendor API',
      kind: 'Task',
      sections: completeTaskSections,
      metadata: { priority: 'high', workSize: 8, complexity: 'high', impact: 'high' },
      scoring: { urgency: 'high', enablement: 'substantial', confidence: 'medium' },
      relationships: { externalBlocker: true, note: 'Vendor must grant API access.' },
    }),
    expected: { score: 41, nativeFields: 5, fallback: {}, labels: ['blocked'] },
  },
  {
    id: 'T10',
    capabilities: organizationCapabilities(),
    input: assessed({
      target: 'acme/widgets',
      title: 'consume the stable task API',
      kind: 'Task',
      sections: completeTaskSections,
      metadata: { priority: 'medium', workSize: 5, complexity: 'medium', impact: 'high' },
      scoring: { urgency: 'moderate', enablement: 'substantial', confidence: 'high' },
      relationships: { blockedBy: 'acme/widgets#42' },
    }),
    expected: { score: 52, nativeFields: 5, fallback: {}, labels: ['blocked'] },
  },
  {
    id: 'T11',
    capabilities: organizationCapabilities({ partial: true }),
    input: assessed({
      target: 'acme/widgets',
      title: 'add a repository health summary',
      kind: 'Task',
      sections: completeTaskSections,
      metadata: { priority: 'medium', workSize: 3, complexity: 'low', impact: 'medium' },
      scoring: { urgency: 'moderate', enablement: 'some', confidence: 'high' },
    }),
    expected: {
      score: 37,
      nativeFields: 2,
      fallback: { complexity: 'low', impact: 'medium', 'task-score': 37 },
      labels: [],
    },
  },
  {
    id: 'T13',
    capabilities: organizationCapabilities(),
    input: assessed({
      target: 'acme/widgets',
      title: 'establish the foundational task platform',
      kind: 'Task',
      sections: completeTaskSections,
      metadata: { priority: 'high', workSize: 21, complexity: 'high', impact: 'very-high' },
      scoring: { urgency: 'high', enablement: 'foundational', confidence: 'high' },
    }),
    expected: { score: 64, nativeFields: 5, fallback: {}, labels: [] },
  },
  {
    id: 'T14',
    capabilities: organizationCapabilities(),
    input: assessed(
      {
        target: 'acme/widgets',
        title: 'complete the contractual sequencing task',
        kind: 'Task',
        sections: completeTaskSections,
        metadata: { priority: 'urgent', workSize: 1, complexity: 'low', impact: 'low' },
        scoring: { urgency: 'moderate', enablement: 'none', confidence: 'high' },
        priorityRationale: 'A contractual sequencing policy requires this work first.',
      },
      {
        priority: {
          source: 'policy',
          rationale: 'A contractual sequencing policy requires this work first.',
        },
      },
    ),
    expected: { score: 22, nativeFields: 5, fallback: {}, labels: [] },
  },
];

export default fixtures;
