import { renderTaskBody } from '../../task-author/utils/render-task-body.js';

export const parentAcceptanceCriteria = Object.freeze([
  'Operators can inspect one normalized report',
  'Publication resumes safely after a partial write',
]);

export const sharedConstraint = 'Retain compatibility with current agents.';

export function parentSections(overrides = {}) {
  return {
    problem: 'Oversized task handling is ad hoc.',
    desiredOutcome: 'One bounded decomposition workflow is available.',
    inScope: ['Inspect and publish one shallow decomposition'],
    outOfScope: ['Milestone planning'],
    acceptanceCriteria: [...parentAcceptanceCriteria],
    delivery:
      'The linked completion pull request contains the implementation and passing validation.',
    alternatives: sharedConstraint,
    ...overrides,
  };
}

export function parentIssue(overrides = {}) {
  return {
    id: 10_001,
    number: 1,
    html_url: 'https://github.com/acme/widgets/issues/1',
    title: 'Add safe oversized-task handling',
    body: renderTaskBody('feature', parentSections()).body,
    state: 'open',
    state_reason: null,
    type: { name: 'Feature' },
    labels: [{ name: 'custom-preserved' }],
    assignees: [{ login: 'octocat' }],
    milestone: { number: 4, title: 'Task workflows' },
    ...overrides,
  };
}

function childTask(title, outcome, acceptanceCriterion) {
  return {
    kind: 'task',
    title,
    sections: {
      context: 'The parent task requires a bounded child outcome.',
      outcome,
      scope: [outcome],
      outOfScope: ['Milestone planning'],
      acceptanceCriteria: [acceptanceCriterion],
      delivery:
        'The linked completion pull request contains the implementation and passing focused validation.',
      constraints: sharedConstraint,
    },
    metadata: { workSize: 3, complexity: 'low', impact: 'medium' },
    scoring: { urgency: 'none', enablement: 'some', confidence: 'high' },
    assessment: {
      workSize: { source: 'agent', rationale: 'The child is a bounded multi-step change.' },
      complexity: { source: 'agent', rationale: 'The child follows established local patterns.' },
      impact: { source: 'agent', rationale: 'The child materially improves the local workflow.' },
      urgency: { source: 'policy', rationale: 'No urgency signal is recorded.' },
      enablement: { source: 'agent', rationale: 'The child enables the complete parent outcome.' },
      confidence: { source: 'agent', rationale: 'The child evidence and boundary are explicit.' },
    },
  };
}

export function decompositionProposal(overrides = {}) {
  const children = [
    {
      key: 'inspection',
      task: childTask(
        'Add normalized decomposition inspection',
        'Expose one normalized read-only evidence report.',
        'The read-only report is deterministic',
      ),
      covers: [parentAcceptanceCriteria[0]],
      sourceEvidence: ['The parent requires normalized inspection.'],
    },
    {
      key: 'publication',
      task: childTask(
        'Add resumable decomposition publication',
        'Publish one approved shallow graph without rollback.',
        'A partial write can be resumed without duplication',
      ),
      covers: [parentAcceptanceCriteria[1]],
      sourceEvidence: ['The parent requires safe materialization.'],
    },
  ];
  return {
    target: 'acme/widgets#1',
    recommendation: {
      decision: 'decompose',
      rationale: ['The parent contains two independently completable delivery outcomes.'],
      explicitReviewAcknowledged: true,
    },
    analysis: { gaps: [], overlaps: [], duplicates: [] },
    sharedConstraints: [sharedConstraint],
    children,
    dependencies: [
      {
        blocked: 'publication',
        blockedBy: 'inspection',
        reason: 'Publication consumes the normalized inspection contract.',
      },
    ],
    parentRevision: {
      kind: 'feature',
      title: 'Deliver safe oversized-task handling',
      sections: parentSections({
        desiredOutcome: 'The child tasks collectively deliver one safe decomposition workflow.',
        inScope: ['Track the bounded child outcomes and verify the complete workflow'],
      }),
      revisionSummary:
        'Split the implementation into inspection and publication children while retaining this issue as the outcome rollup.',
    },
    ...overrides,
  };
}

export function parentFields(workSize = 21) {
  return [
    {
      issue_field_id: 102,
      issue_field_name: 'Work size',
      data_type: 'single_select',
      single_select_option: { name: String(workSize) },
      value: null,
    },
  ];
}
