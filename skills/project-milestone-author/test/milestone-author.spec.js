import assert from 'node:assert/strict';

import { applyMilestone, inspectMilestone, planMilestone } from '../lib/milestone-author.js';
import {
  fakeGitHubMilestoneClient,
  milestoneFixture,
  taskFixture,
} from './fake-github-milestone-client.js';

function approve(input, preview) {
  return {
    ...input,
    publication: {
      approvedDigest: preview.publication.digest,
      approvedTarget: preview.publication.target,
      safetyReviewed: true,
    },
  };
}

describe('project-milestone-author/lib/milestone-author', () => {
  it('should inspect the complete description and current issue membership without writing', () => {
    const client = fakeGitHubMilestoneClient({
      milestones: [milestoneFixture({ description: 'Outcome, scope, and completion notes.' })],
      tasks: [
        taskFixture({ milestone: { number: 4, title: 'Ship the milestone' }, number: 1 }),
        taskFixture({
          milestone: { number: 4, title: 'Ship the milestone' },
          number: 2,
          pullRequest: true,
        }),
      ],
    });

    const report = inspectMilestone({ target: 'acme/widgets#4' }, { githubClient: client });

    assert.equal(report.status, 'inspected');
    assert.equal(report.milestone.description, 'Outcome, scope, and completion notes.');
    assert.deepEqual(
      report.taskMembers.map(({ number }) => number),
      [1],
    );
    assert.deepEqual(
      report.pullRequestMembers.map(({ number }) => number),
      [2],
    );
    assert.equal(report.mutatesGitHub, false);
    assert.equal(
      client.calls.some(({ operation }) => operation?.startsWith('update')),
      false,
    );
  });

  it('should create and verify one exact desired milestone', () => {
    const client = fakeGitHubMilestoneClient();
    const input = {
      desired: {
        description: '## Outcome\n\nDeliver one bounded result.',
        dueDate: '2026-09-01',
        title: 'Milestone author live proof',
      },
      target: 'acme/widgets',
    };
    const preview = planMilestone(input, { githubClient: client });

    assert.equal(preview.status, 'approval_required');
    assert.deepEqual(
      preview.plannedMutation.operations.map(({ type }) => type),
      ['createMilestone'],
    );
    assert.match(preview.publication.digest, /^sha256:[a-f0-9]{64}$/);
    assert.equal(
      client.calls.some(({ operation }) => operation === 'createMilestone'),
      false,
    );

    const report = applyMilestone(approve(input, preview), { githubClient: client });

    assert.equal(report.status, 'created');
    assert.equal(report.verification.status, 'verified');
    assert.equal(client.state.milestones.at(-1).due_on, '2026-09-01T23:59:59Z');
  });

  it('should apply one desired-state update without changing task membership', () => {
    const client = fakeGitHubMilestoneClient({
      milestones: [milestoneFixture({ description: 'Owner note' })],
    });
    const input = {
      desired: {
        description: '## Outcome\n\nRevised result.\n\nOwner note',
        dueDate: '2026-09-30',
        state: 'closed',
        title: 'Revised milestone',
      },
      target: 'acme/widgets#4',
    };
    const preview = planMilestone(input, { githubClient: client });

    assert.deepEqual(
      preview.plannedMutation.operations.map(({ type }) => type),
      ['updateMilestone'],
    );
    const report = applyMilestone(approve(input, preview), { githubClient: client });

    assert.equal(report.status, 'updated');
    assert.equal(report.verification.status, 'verified');
    assert.equal(client.state.milestones[0].description.endsWith('Owner note'), true);
    assert.equal(client.state.milestones[0].state, 'closed');
  });

  it('should apply only explicitly selected task-membership changes', () => {
    const targetMilestone = { number: 4, title: 'Ship the milestone' };
    const otherMilestone = { number: 7, title: 'Other milestone' };
    const client = fakeGitHubMilestoneClient({
      milestones: [milestoneFixture(), milestoneFixture({ number: 7, title: 'Other milestone' })],
      tasks: [
        taskFixture({ number: 1 }),
        taskFixture({ milestone: targetMilestone, number: 2 }),
        taskFixture({ milestone: targetMilestone, number: 3 }),
        taskFixture({ milestone: otherMilestone, number: 4 }),
        taskFixture({ milestone: targetMilestone, number: 5, pullRequest: true }),
      ],
    });
    const input = {
      membership: {
        add: [1, 2, 4],
        allowMoveFromOtherMilestones: true,
        remove: [3],
      },
      target: 'acme/widgets#4',
    };
    const preview = planMilestone(input, { githubClient: client });

    assert.deepEqual(
      preview.plannedMutation.operations.map(({ type }) => type),
      ['setTaskMilestone', 'setTaskMilestone', 'setTaskMilestone'],
    );
    const report = applyMilestone(approve(input, preview), { githubClient: client });

    assert.equal(report.status, 'updated');
    assert.equal(report.verification.status, 'verified');
    assert.equal(client.state.tasks.find(({ number }) => number === 1).milestone.number, 4);
    assert.equal(client.state.tasks.find(({ number }) => number === 3).milestone, null);
    assert.equal(client.state.tasks.find(({ number }) => number === 4).milestone.number, 4);
    assert.equal(client.state.tasks.find(({ number }) => number === 5).milestone.number, 4);
  });

  it('should require separate plans for milestone fields and task membership', () => {
    const client = fakeGitHubMilestoneClient();
    const report = planMilestone(
      {
        desired: { state: 'closed' },
        membership: { add: [1] },
        target: 'acme/widgets#4',
      },
      { githubClient: client },
    );

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.plannedMutation.operations, []);
    assert.match(report.blockers[0], /separate plans and separate approvals/);
    assert.equal(
      client.calls.some(({ operation }) => operation?.startsWith('update')),
      false,
    );
  });

  it('should reject unsupported desired and membership fields', () => {
    const desired = applyMilestone(
      { desired: { due_date: '2026-09-30' }, target: 'acme/widgets#4' },
      { githubClient: fakeGitHubMilestoneClient() },
    );
    const membership = planMilestone(
      { membership: { add: [1], move: true }, target: 'acme/widgets#4' },
      { githubClient: fakeGitHubMilestoneClient({ tasks: [taskFixture({ number: 1 })] }) },
    );

    assert.equal(desired.status, 'blocked');
    assert.equal(desired.mode, 'apply');
    assert.match(desired.blockers[0], /Desired contains unsupported fields: due_date/);
    assert.equal(membership.status, 'blocked');
    assert.match(membership.blockers[0], /Membership contains unsupported fields: move/);
  });

  it('should support explicit due-date clearing and aligned desired state', () => {
    const client = fakeGitHubMilestoneClient({
      milestones: [milestoneFixture({ dueOn: '2026-09-30T23:59:59Z' })],
    });
    const input = { desired: { dueDate: null }, target: 'acme/widgets#4' };
    const preview = planMilestone(input, { githubClient: client });
    const report = applyMilestone(approve(input, preview), { githubClient: client });

    assert.equal(report.status, 'updated');
    assert.equal(client.state.milestones[0].due_on, null);
    const aligned = applyMilestone(input, { githubClient: client });
    assert.equal(aligned.status, 'aligned');
    assert.equal(aligned.mode, 'apply');
  });

  it('should block duplicate identity, stale approval, and credential-shaped text', () => {
    const duplicate = planMilestone(
      {
        desired: { description: 'Description', title: 'Ship the milestone' },
        target: 'acme/widgets',
      },
      { githubClient: fakeGitHubMilestoneClient() },
    );
    assert.equal(duplicate.status, 'blocked');

    const input = {
      desired: { description: 'Description', title: 'Fresh milestone' },
      target: 'acme/widgets',
    };
    const preview = planMilestone(input, { githubClient: fakeGitHubMilestoneClient() });
    const stale = applyMilestone(
      {
        ...input,
        publication: {
          approvedDigest: 'sha256:stale',
          approvedTarget: preview.target,
          safetyReviewed: true,
        },
      },
      { githubClient: fakeGitHubMilestoneClient() },
    );
    assert.equal(stale.status, 'approval_required');
    assert.equal(stale.mode, 'apply');
    assert.equal(stale.mutatesGitHub, false);

    const sensitive = planMilestone(
      {
        desired: {
          description: 'Description',
          title: 'Never publish ghp_abcdefghijklmnopqrstuvwxyz123456',
        },
        target: 'acme/widgets',
      },
      { githubClient: fakeGitHubMilestoneClient() },
    );
    assert.equal(sensitive.status, 'publication_blocked');
  });

  it('should block ambiguous selectors, missing tasks, pull requests, and unapproved moves', () => {
    const duplicateClient = fakeGitHubMilestoneClient({
      milestones: [
        milestoneFixture({ number: 4, title: 'Duplicate' }),
        milestoneFixture({ number: 5, state: 'closed', title: 'Duplicate' }),
      ],
    });
    assert.equal(
      inspectMilestone(
        { target: { repository: 'acme/widgets', title: 'Duplicate' } },
        { githubClient: duplicateClient },
      ).status,
      'blocked',
    );

    const membershipClient = fakeGitHubMilestoneClient({
      milestones: [milestoneFixture(), milestoneFixture({ number: 7, title: 'Other' })],
      tasks: [
        taskFixture({ milestone: { number: 7, title: 'Other' }, number: 4 }),
        taskFixture({ number: 8, pullRequest: true }),
      ],
    });
    for (const number of [4, 8, 99]) {
      const report = planMilestone(
        { membership: { add: [number] }, target: 'acme/widgets#4' },
        { githubClient: membershipClient },
      );
      assert.equal(report.status, 'blocked');
    }
    assert.equal(
      membershipClient.calls.some(({ operation }) => operation === 'createMilestone'),
      false,
    );
  });

  it('should report denied, dropped, and partially applied writes without rollback', () => {
    const deniedClient = fakeGitHubMilestoneClient({ createFailure: 'POST milestone: HTTP 403' });
    const create = {
      desired: { description: 'Description', title: 'Denied milestone' },
      target: 'acme/widgets',
    };
    const createPreview = planMilestone(create, { githubClient: deniedClient });
    const denied = applyMilestone(approve(create, createPreview), { githubClient: deniedClient });
    assert.equal(denied.status, 'failed');
    assert.equal(denied.mutatesGitHub, false);

    const droppedClient = fakeGitHubMilestoneClient({ dropMilestoneFields: ['description'] });
    const update = { desired: { description: 'Changed' }, target: 'acme/widgets#4' };
    const updatePreview = planMilestone(update, { githubClient: droppedClient });
    const dropped = applyMilestone(approve(update, updatePreview), {
      githubClient: droppedClient,
    });
    assert.equal(dropped.status, 'partial');
    assert.ok(dropped.verification.mismatches.some(({ key }) => key === 'milestone:description'));

    const targetMilestone = { number: 4, title: 'Ship the milestone' };
    const partialClient = fakeGitHubMilestoneClient({
      membershipFailures: [3],
      tasks: [taskFixture({ number: 1 }), taskFixture({ milestone: targetMilestone, number: 3 })],
    });
    const membership = {
      membership: { add: [1], remove: [3] },
      target: 'acme/widgets#4',
    };
    const membershipPreview = planMilestone(membership, { githubClient: partialClient });
    const partial = applyMilestone(approve(membership, membershipPreview), {
      githubClient: partialClient,
    });
    assert.equal(partial.status, 'partial');
    assert.equal(partialClient.state.tasks[0].milestone.number, 4);
    assert.equal(partialClient.state.tasks[1].milestone.number, 4);
  });

  it('should read back an update after a lost response and report observed partial success', () => {
    const client = fakeGitHubMilestoneClient({
      updateFailureAfterApply: 'PATCH milestone: connection closed after write',
    });
    const input = { desired: { state: 'closed' }, target: 'acme/widgets#4' };
    const preview = planMilestone(input, { githubClient: client });
    const report = applyMilestone(approve(input, preview), { githubClient: client });

    assert.equal(report.status, 'partial');
    assert.equal(report.mutatesGitHub, true);
    assert.equal(report.verification.status, 'verified');
  });
});
