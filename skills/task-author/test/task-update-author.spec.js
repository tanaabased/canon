import assert from 'node:assert/strict';

import { updateTask } from '../lib/task-update-author.js';
import { authorTaskDraft } from '../lib/task-draft-author.js';
import { fakeGitHubTaskClient } from './fake-github-task-client.js';
import {
  completeBugSections,
  completeFeatureSections,
  completeTaskSections,
  fakeClient,
  organizationCapabilities,
} from '../../../test/task-management-fixtures.js';

function approve(input, preview) {
  return {
    ...input,
    publication: {
      safetyReviewed: true,
      approvedTarget: preview.publication.target,
      approvedDigest: preview.publication.digest,
    },
  };
}

function initialIssue(number, title, body, labels = [], type = null) {
  return {
    number,
    html_url: `https://github.com/acme/widgets/issues/${number}`,
    title,
    body,
    type: type ? { name: type } : null,
    labels: labels.map((name) => ({ name })),
  };
}

function observedFields(draft, capabilities) {
  return draft.metadata.native.fields.map((field) => {
    const definition = capabilities.issueFields.values.find(
      ({ id }) => Number(id) === Number(field.id),
    );
    const value = field.type === 'single_select' ? field.value.name : field.value;
    return {
      issue_field_id: Number(field.id),
      issue_field_name: field.name,
      data_type: definition.data_type,
      value: field.type === 'single_select' ? null : value,
      single_select_option: field.type === 'single_select' ? { name: value } : null,
    };
  });
}

describe('Task Author existing-issue modes', () => {
  it('should normalize T07 without guessing missing evidence', () => {
    const capabilities = organizationCapabilities();
    const input = {
      mode: 'normalize',
      target: 'acme/widgets#81',
      actionable: false,
      questions: [
        'Which task kind fits?',
        'What is the current condition?',
        'What outcome is desired?',
        'What observable acceptance evidence is required?',
      ],
    };
    const options = {
      initialIssue: initialIssue(81, 'make sync better', 'sync is annoying and should be improved'),
    };
    const preview = updateTask(input, {
      githubClient: fakeGitHubTaskClient(capabilities, options),
    });

    assert.equal(preview.status, 'approval_required');
    assert.equal(preview.body, 'sync is annoying and should be improved');
    assert.equal(preview.taskKind, null);
    assert.deepEqual(preview.plannedMutation.mutation, { labels: ['needs triage'] });

    const client = fakeGitHubTaskClient(capabilities, options);
    const report = updateTask(approve(input, preview), { githubClient: client });
    assert.equal(report.status, 'updated');
    assert.deepEqual(client.state.issue.labels, [{ name: 'needs triage' }]);
    assert.equal(client.state.issue.body, 'sync is annoying and should be improved');
  });

  it('should normalize T08 without inventing reproduction or estimates', () => {
    const capabilities = organizationCapabilities();
    const input = {
      mode: 'normalize',
      target: 'acme/widgets#82',
      kind: 'Bug',
      sections: { ...completeBugSections, reproduction: '' },
      metadata: { impact: 'high' },
      assessment: {
        impact: { source: 'agent', rationale: 'The reported blast radius supports high impact.' },
      },
      actionable: false,
      reproductionAvailable: false,
    };
    const options = {
      initialIssue: initialIssue(82, 'restore task output', 'output is missing for all users'),
    };
    const preview = updateTask(input, {
      githubClient: fakeGitHubTaskClient(capabilities, options),
    });

    assert.equal(preview.status, 'approval_required');
    assert.equal(preview.scoring.score, null);
    assert.deepEqual(preview.plannedMutation.issue.labels, ['needs triage', 'needs reproduction']);
    assert.equal(preview.plannedMutation.mutation.issue_field_values.length, 1);

    const report = updateTask(approve(input, preview), {
      githubClient: fakeGitHubTaskClient(capabilities, options),
    });
    assert.equal(report.status, 'updated');
    assert.equal(report.verification.status, 'verified');
  });

  it('should satisfy R01 with a semantic update and preserved discussion', () => {
    const capabilities = organizationCapabilities();
    const oldInput = {
      target: 'acme/widgets#90',
      title: 'add machine-readable task inspection',
      kind: 'Feature',
      sections: completeFeatureSections,
      metadata: { priority: 'medium', workSize: 5, complexity: 'medium', impact: 'high' },
      scoring: { urgency: 'moderate', enablement: 'substantial', confidence: 'high' },
      assessment: {
        priority: { source: 'human', rationale: 'A human selected medium priority.' },
        workSize: { source: 'agent', rationale: 'The original scope fits work size 5.' },
        complexity: { source: 'agent', rationale: 'The original scope has medium complexity.' },
        impact: { source: 'agent', rationale: 'The API has high impact.' },
        urgency: { source: 'agent', rationale: 'The timing is moderately urgent.' },
        enablement: { source: 'agent', rationale: 'The API substantially enables automation.' },
        confidence: { source: 'agent', rationale: 'The evidence supports high confidence.' },
      },
    };
    const oldDraft = authorTaskDraft(oldInput, {
      githubClient: fakeClient(capabilities),
    });
    const oldComments = [
      { id: 1, body: oldDraft.comments[0].body },
      { id: 2, body: 'Earlier implementation discussion must remain.' },
    ];
    const options = {
      initialIssue: initialIssue(90, oldDraft.title, oldDraft.body, [], oldDraft.taskKind.name),
      initialFields: observedFields(oldDraft, capabilities),
      initialComments: oldComments,
    };
    const input = {
      ...oldInput,
      mode: 'revise',
      sections: {
        ...completeFeatureSections,
        desiredOutcome: 'Expose a stable task API with an explicit compatibility contract.',
        inScope: ['One versioned JSON schema'],
        acceptanceCriteria: ['The schema is documented', 'A breaking migration guide is recorded'],
      },
      metadata: { ...oldInput.metadata, workSize: 8, complexity: 'high' },
      assessment: {
        ...oldInput.assessment,
        workSize: { source: 'agent', rationale: 'The compatibility work raises size to 8.' },
        complexity: { source: 'agent', rationale: 'Compatibility raises complexity to high.' },
      },
      signals: { breakingChange: true },
      revisionSummary:
        'Compatibility evidence changed the outcome, narrowed scope, and added a migration requirement.',
    };
    const preview = updateTask(input, {
      githubClient: fakeGitHubTaskClient(capabilities, options),
    });

    assert.equal(preview.status, 'approval_required');
    assert.ok(preview.plannedMutation.issue.labels.includes('breaking change'));
    assert.ok(preview.plannedMutation.comments.some(({ kind }) => kind === 'revision-summary'));
    assert.ok(preview.plannedMutation.comments.some(({ kind }) => kind === 'task-score'));
    assert.match(
      preview.plannedMutation.comments.find(({ kind }) => kind === 'task-score').body,
      /supersedes the previous automated task assessment/,
    );

    const client = fakeGitHubTaskClient(capabilities, options);
    const report = updateTask(approve(input, preview), { githubClient: client });
    assert.equal(report.status, 'updated');
    assert.equal(report.verification.status, 'verified');
    assert.equal(client.state.comments[1].body, 'Earlier implementation discussion must remain.');
    assert.equal(client.state.comments.length, 4);
  });

  it('should preserve every current issue field when recomputing Task score', () => {
    const capabilities = organizationCapabilities();
    const originalInput = {
      target: 'acme/widgets#99',
      title: 'assess utilities as standalone packages',
      kind: 'Task',
      sections: completeTaskSections,
      metadata: { workSize: 21, complexity: 'high', impact: 'medium' },
      scoring: { urgency: 'none', enablement: 'substantial', confidence: 'high' },
      assessment: {
        workSize: { source: 'agent', rationale: 'The inventory is broad.' },
        complexity: { source: 'agent', rationale: 'The comparisons require research.' },
        impact: { source: 'agent', rationale: 'The report has medium local value.' },
        urgency: { source: 'policy', rationale: 'No urgency signal exists.' },
        enablement: { source: 'agent', rationale: 'Several follow-ups become possible.' },
        confidence: { source: 'agent', rationale: 'The inventory is directly verified.' },
      },
      publishScoringAudit: false,
    };
    const originalDraft = authorTaskDraft(originalInput, {
      githubClient: fakeClient(capabilities),
    });
    const initialFields = observedFields(originalDraft, capabilities);
    initialFields.find(({ issue_field_name: name }) => name === 'Impact').single_select_option = {
      name: 'Very high',
    };
    const options = {
      initialIssue: initialIssue(
        99,
        originalDraft.title,
        originalDraft.body,
        [],
        originalDraft.taskKind.name,
      ),
      initialFields,
    };
    const input = {
      ...originalInput,
      mode: 'revise',
      metadata: { ...originalInput.metadata, impact: 'very-high' },
      assessment: {
        ...originalInput.assessment,
        impact: { source: 'human', rationale: 'A human changed Impact to Very high.' },
      },
      revisionSummary: 'Recomputed task-score/v1 after Impact changed to Very high.',
    };
    const preview = updateTask(input, {
      githubClient: fakeGitHubTaskClient(capabilities, options),
    });

    assert.equal(preview.scoring.score, 50);
    assert.equal(preview.plannedMutation.mutation.issue_field_values.length, 4);

    const client = fakeGitHubTaskClient(capabilities, options);
    const report = updateTask(approve(input, preview), { githubClient: client });
    assert.equal(report.status, 'updated');
    assert.equal(report.verification.status, 'verified');
    assert.equal(client.state.fields.length, 4);
  });
});
