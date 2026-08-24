import assert from 'node:assert/strict';

import { prepareTaskDecomposition } from '../lib/task-decomposition-planner.js';
import { publishTaskDecomposition } from '../lib/task-decomposition-publisher.js';
import { fakeGitHubTaskDecomposerClient } from './fake-github-task-decomposer-client.js';
import { decompositionProposal, parentFields, parentIssue } from './task-decomposition-fixtures.js';

function clientFixture(options = {}) {
  return fakeGitHubTaskDecomposerClient({
    issues: [parentIssue()],
    fields: { 1: parentFields(21) },
    ...options,
  });
}

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

describe('Task Decomposer exact planning', () => {
  it('should preview every storage surface and bind one digest without mutation', () => {
    const client = clientFixture();
    const preview = prepareTaskDecomposition(decompositionProposal(), { client });

    assert.equal(preview.status, 'approval_required');
    assert.equal(preview.mutatesGitHub, false);
    assert.match(preview.publication.digest, /^sha256:[a-f0-9]{64}$/);
    assert.equal(preview.publication.target, 'acme/widgets#1');
    assert.deepEqual(
      preview.plan.children.map(({ action }) => action),
      ['create', 'create'],
    );
    assert.equal(preview.plan.children[0].taskPlan.issue.type, 'Task');
    assert.deepEqual(preview.plan.children[1].taskPlan.issue.labels, ['blocked']);
    assert.equal(Object.hasOwn(preview.plan.children[0], 'taskPreview'), false);
    assert.equal(Object.hasOwn(preview.plan.children[0], 'existingBlockedBy'), false);
    assert.deepEqual(preview.plan.relationships.dependencies[0], {
      blocked: 'publication',
      blockedBy: 'inspection',
      reason: 'Publication consumes the normalized inspection contract.',
      action: 'add',
    });
    assert.match(preview.plan.parentRevision.expected.bodyTemplate, /\{\{child:inspection\}\}/);
    assert.deepEqual(preview.plan.parentRevision.storageDiff.preserved, [
      'issue type',
      'issue fields',
      'labels',
      'assignees',
      'milestone',
      'state',
    ]);
    assert.deepEqual(
      preview.plan.operationOrder.map(({ id }) => id),
      [
        'create:inspection',
        'create:publication',
        'sub-issue:inspection',
        'sub-issue:publication',
        'dependency:publication<-inspection',
        'update:parent',
        'comment:parent:decomposition-summary',
        'verify:decomposition',
      ],
    );
    assert.equal(
      client.calls.some(({ operation } = {}) =>
        ['createIssue', 'updateIssue', 'addSubIssue', 'addBlockedBy'].includes(operation),
      ),
      false,
    );
  });

  it('should fail closed on a stale digest', () => {
    const client = clientFixture();
    const report = publishTaskDecomposition(
      {
        ...decompositionProposal(),
        publication: {
          safetyReviewed: true,
          approvedTarget: 'acme/widgets#1',
          approvedDigest: 'sha256:stale',
        },
      },
      { client },
    );

    assert.equal(report.status, 'approval_required');
    assert.equal(report.mutatesGitHub, false);
    assert.equal(client.state.issues.size, 1);
  });

  it('should keep recommendation-only advice read-only', () => {
    const input = {
      target: 'acme/widgets#1',
      recommendation: {
        decision: 'keep_intact',
        rationale: ['The task remains one independently completable outcome.'],
        explicitReviewAcknowledged: true,
      },
      children: [],
      dependencies: [],
    };
    const client = clientFixture({ fields: { 1: parentFields(13) } });

    const report = prepareTaskDecomposition(input, { client });

    assert.equal(report.status, 'keep_intact');
    assert.equal(report.mutatesGitHub, false);
    assert.equal(report.plan, null);
  });

  it('should block a same-title task that is not an exact reusable child', () => {
    const collision = parentIssue({
      id: 10_002,
      number: 2,
      title: 'Add normalized decomposition inspection',
      body: 'Different task evidence.',
      type: { name: 'Task' },
    });
    const client = clientFixture({ issues: [parentIssue(), collision] });

    const report = prepareTaskDecomposition(decompositionProposal(), { client });

    assert.equal(report.status, 'blocked');
    assert.ok(report.blockers.some((blocker) => blocker.includes('collides')));
    assert.ok(
      client.calls.some(
        ({ operation, issueNumber } = {}) => operation === 'readIssue' && issueNumber === 2,
      ),
    );
    assert.equal(
      client.calls.some(({ operation } = {}) => operation === 'createIssue'),
      false,
    );
  });

  it('should reject a parent revision that drops a shared constraint', () => {
    const proposal = decompositionProposal();
    delete proposal.parentRevision.sections.alternatives;
    const report = prepareTaskDecomposition(proposal, { client: clientFixture() });

    assert.equal(report.status, 'blocked');
    assert.ok(report.blockers.some((blocker) => blocker.includes('Parent rollup')));
  });
});

describe('Task Decomposer resumable publication', () => {
  it('should create, relate, revise, and verify one shallow decomposition exactly', () => {
    const client = clientFixture();
    const input = decompositionProposal();
    const preview = prepareTaskDecomposition(input, { client });
    const report = publishTaskDecomposition(approve(input, preview), { client });

    assert.equal(report.status, 'published');
    assert.equal(report.mutatesGitHub, true);
    assert.equal(report.verification.status, 'verified');
    assert.equal(client.state.issues.size, 3);

    const inspection = [...client.state.issues.values()].find(
      ({ title }) => title === 'Add normalized decomposition inspection',
    );
    const publication = [...client.state.issues.values()].find(
      ({ title }) => title === 'Add resumable decomposition publication',
    );
    assert.equal(client.state.parents.get(inspection.number), 1);
    assert.equal(client.state.parents.get(publication.number), 1);
    assert.ok(client.state.blockedBy.get(publication.number).has(inspection.number));

    const parent = client.state.issues.get(1);
    assert.deepEqual(parent.labels, [{ name: 'custom-preserved' }]);
    assert.deepEqual(parent.assignees, [{ login: 'octocat' }]);
    assert.deepEqual(parent.milestone, { number: 4, title: 'Task workflows' });
    assert.match(parent.body, new RegExp(`/issues/${inspection.number}`));
    assert.doesNotMatch(parent.body, /\{\{child:/);
  });

  it('should re-use exact children and produce no duplicate writes on aligned reinspection', () => {
    const client = clientFixture();
    const input = decompositionProposal();
    const firstPreview = prepareTaskDecomposition(input, { client });
    const first = publishTaskDecomposition(approve(input, firstPreview), { client });
    assert.equal(first.status, 'published');
    const creationCount = client.calls.filter(
      ({ operation } = {}) => operation === 'createIssue',
    ).length;

    const secondPreview = prepareTaskDecomposition(decompositionProposal(), { client });
    assert.deepEqual(
      secondPreview.plan.children.map(({ action }) => action),
      ['reuse', 'reuse'],
    );
    assert.deepEqual(
      secondPreview.plan.operationOrder.map(({ id }) => id),
      ['verify:decomposition'],
    );
    const second = publishTaskDecomposition(approve(decompositionProposal(), secondPreview), {
      client,
    });

    assert.equal(second.status, 'aligned');
    assert.equal(second.mutatesGitHub, false);
    assert.equal(client.state.issues.size, 3);
    assert.equal(
      client.calls.filter(({ operation } = {}) => operation === 'createIssue').length,
      creationCount,
    );
  });

  it('should preserve partial success and safely resume without creating duplicates', () => {
    const client = clientFixture({ failOperation: 'addBlockedBy' });
    const input = decompositionProposal();
    const preview = prepareTaskDecomposition(input, { client });
    const partial = publishTaskDecomposition(approve(input, preview), { client });

    assert.equal(partial.status, 'partial');
    assert.equal(partial.mutatesGitHub, true);
    assert.equal(client.state.issues.size, 3);
    assert.ok(
      partial.writes.some(
        ({ operation, status }) =>
          operation === 'dependency:publication<-inspection' && status === 'failed',
      ),
    );
    assert.ok(partial.remainingOperations.includes('update:parent'));

    client.state.failOperation = null;
    const retryInput = decompositionProposal();
    const retryPreview = prepareTaskDecomposition(retryInput, { client });
    assert.deepEqual(
      retryPreview.plan.children.map(({ action }) => action),
      ['reuse', 'reuse'],
    );
    const resumed = publishTaskDecomposition(approve(retryInput, retryPreview), { client });

    assert.equal(resumed.status, 'published');
    assert.equal(resumed.verification.status, 'verified');
    assert.equal(client.state.issues.size, 3);
    assert.equal(
      client.calls.filter(({ operation } = {}) => operation === 'createIssue').length,
      2,
    );
  });

  it('should expose a provider rejection with the exact operation still remaining', () => {
    const client = clientFixture({ failOperation: 'createIssue' });
    const input = decompositionProposal();
    const preview = prepareTaskDecomposition(input, { client });
    const report = publishTaskDecomposition(approve(input, preview), { client });

    assert.equal(report.status, 'failed');
    assert.equal(report.mutatesGitHub, false);
    assert.equal(report.writes[0].operation, 'create:inspection');
    assert.equal(report.writes[0].status, 'failed');
    assert.equal(report.remainingOperations[0], 'create:inspection');
    assert.equal(client.state.issues.size, 1);
  });

  it('should report a silently dropped parent value through exact read-back verification', () => {
    const client = clientFixture({ dropParentBody: true });
    const input = decompositionProposal();
    const preview = prepareTaskDecomposition(input, { client });
    const report = publishTaskDecomposition(approve(input, preview), { client });

    assert.equal(report.status, 'partial');
    assert.equal(report.mutatesGitHub, true);
    assert.equal(report.verification.status, 'drifted');
    assert.ok(report.verification.mismatches.some(({ key }) => key === 'parent-body'));
    assert.deepEqual(report.remainingOperations, ['verify:decomposition']);
  });
});
