import taskManagementSchema from '../references/task-management-schema.json' with { type: 'json' };

const CANONICAL_LABEL_NAMES = Object.freeze(taskManagementSchema.labels.map(({ name }) => name));

export const completeTaskSections = Object.freeze({
  context: 'Release checks are repeated manually.',
  outcome: 'One consolidated repository health summary is available.',
  scope: ['Consolidate the existing repository health checks'],
  outOfScope: ['Automatic remediation'],
  acceptanceCriteria: ['The summary reports every supported check', 'Validation passes'],
  delivery:
    'The completion pull request contains the summary implementation and the observed validation results.',
});

export const completeBugSections = Object.freeze({
  observedBehavior: 'The current release omits stale plugin files during cache refresh.',
  expectedBehavior: 'Stale plugin files are removed.',
  reproduction: 'Run the refresh twice and inspect the installed cache.',
  impactSummary: 'The release workflow retains incorrect output.',
  delivery:
    'Open the linked completion pull request as a draft with a regression test that runs in disposable GitHub Actions, preserve the failing baseline run, then show the same test and relevant refresh checks passing with the fix.',
  acceptanceCriteria: [
    'A regression test fails against the affected baseline for the expected reason',
    'The same regression test passes with the fix',
    'A refresh removes every stale plugin file',
  ],
});

export const completeFeatureSections = Object.freeze({
  problem: 'Automation lacks a stable machine-readable task inspection surface.',
  desiredOutcome: 'Expose a supported task inspection JSON contract.',
  inScope: ['One versioned JSON schema'],
  outOfScope: ['Unrelated CLI redesign'],
  acceptanceCriteria: ['The schema is documented', 'Migration evidence is recorded'],
  delivery:
    'The linked draft completion pull request contains the versioned schema, tests or executable examples, user-facing documentation, migration evidence, and passing relevant checks.',
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
    fields.push(schemaField(105, 'complexity'), schemaField(106, 'impact'));
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
    }),
    expected: { nativeFields: 4, fallback: {}, labels: [] },
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
      signals: { regression: true },
      reproductionAvailable: true,
    }),
    expected: { nativeFields: 4, fallback: {}, labels: ['regression'] },
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
      signals: { breakingChange: true },
    }),
    expected: { nativeFields: 5, fallback: {}, labels: ['breaking change'] },
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
      signals: { documentation: true },
    }),
    expected: {
      nativeFields: 0,
      fallback: {
        type: 'task',
        priority: 'low',
        'work-size': 2,
        complexity: 'low',
        impact: 'low',
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
      signals: { regression: true },
      reproductionAvailable: true,
    }),
    expected: { nativeFields: 0, labels: ['regression'] },
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
      signals: { helpWanted: true, goodFirstIssue: true },
    }),
    expected: { nativeFields: 0, labels: ['help wanted'] },
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
      relationships: { externalBlocker: true, note: 'Vendor must grant API access.' },
    }),
    expected: { nativeFields: 4, fallback: {}, labels: ['blocked'] },
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
      relationships: { blockedBy: 'acme/widgets#42' },
    }),
    expected: { nativeFields: 4, fallback: {}, labels: ['blocked'] },
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
    }),
    expected: {
      nativeFields: 2,
      fallback: { complexity: 'low', impact: 'medium' },
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
    }),
    expected: { nativeFields: 4, fallback: {}, labels: [] },
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
      },
      {
        priority: {
          source: 'policy',
          rationale: 'A contractual sequencing policy requires this work first.',
        },
      },
    ),
    expected: { nativeFields: 4, fallback: {}, labels: [] },
  },
];

export default fixtures;
