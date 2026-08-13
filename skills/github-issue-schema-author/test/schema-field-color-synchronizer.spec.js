import assert from 'node:assert/strict';

import { synchronizeGitHubIssueFieldColors } from '../lib/schema-field-color-synchronizer.js';
import { fakeFieldColorClient, grayFieldColorState } from './fake-issue-field-client.js';

function authorize(preview) {
  return {
    approvedOrganization: preview.authorization.organization,
    approvedDigest: preview.authorization.digest,
  };
}

function identity(options) {
  return options.map(({ id, name, description, priority }) => ({
    id,
    name,
    description,
    priority,
  }));
}

describe('skills/github-issue-schema-author/lib/schema-field-color-synchronizer', () => {
  it('should preview three color-only PATCH operations with every option identity retained', () => {
    const client = fakeFieldColorClient();
    const report = synchronizeGitHubIssueFieldColors('tanaabased/agent-system-test', { client });

    assert.equal(report.status, 'approval_required');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(
      report.plannedMutation.operations.map(({ field }) => field.name),
      ['Work size', 'Complexity', 'Impact'],
    );
    assert.deepEqual(report.plannedMutation.creates, []);
    assert.deepEqual(report.plannedMutation.deletions, []);
    for (const operation of report.plannedMutation.operations) {
      assert.equal(operation.method, 'PATCH');
      assert.deepEqual(Object.keys(operation.body), ['options']);
      assert.deepEqual(identity(operation.before.options), identity(operation.body.options));
    }
    assert.deepEqual(
      report.plannedMutation.operations[0].body.options.map(({ name, color }) => ({
        name,
        color,
      })),
      [
        { name: '1', color: 'green' },
        { name: '2', color: 'green' },
        { name: '3', color: 'green' },
        { name: '5', color: 'blue' },
        { name: '8', color: 'blue' },
        { name: '13', color: 'yellow' },
        { name: '21', color: 'red' },
      ],
    );
  });

  it('should recolor and exactly verify all fields after digest-bound authorization', () => {
    const client = fakeFieldColorClient();
    const preview = synchronizeGitHubIssueFieldColors('tanaabased/agent-system-test', { client });
    const report = synchronizeGitHubIssueFieldColors('tanaabased/agent-system-test', {
      client,
      authorization: authorize(preview),
    });

    assert.equal(report.status, 'updated');
    assert.equal(report.mutatesGitHub, true);
    assert.equal(report.writes.length, 3);
    assert.equal(report.verification.status, 'verified');
    assert.ok(report.writes.every(({ status }) => status === 'succeeded'));
    assert.equal(client.calls.filter((call) => call.operation === 'recolorIssueField').length, 3);
  });

  it('should be idempotent when canonical colors are already present', () => {
    const client = fakeFieldColorClient({ canonical: true });
    const report = synchronizeGitHubIssueFieldColors('tanaabased/agent-system-test', { client });

    assert.equal(report.status, 'aligned');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.plannedMutation.operations, []);
  });

  it('should stop after a failed update and preserve successful color changes without rollback', () => {
    const client = fakeFieldColorClient({ failAt: 2 });
    const preview = synchronizeGitHubIssueFieldColors('tanaabased/agent-system-test', { client });
    const report = synchronizeGitHubIssueFieldColors('tanaabased/agent-system-test', {
      client,
      authorization: authorize(preview),
    });

    assert.equal(report.status, 'partial');
    assert.deepEqual(
      report.writes.map(({ status }) => status),
      ['succeeded', 'failed'],
    );
    assert.equal(report.verification.status, 'drifted');
    assert.equal(client.state.fields[0].options[0].color, 'green');
    assert.equal(client.state.fields[1].options[0].color, 'gray');
  });

  it('should block option-set drift instead of replacing or removing options', () => {
    const stateFields = grayFieldColorState();
    stateFields[0].options.pop();
    const client = fakeFieldColorClient({ stateFields });
    const report = synchronizeGitHubIssueFieldColors('tanaabased/agent-system-test', { client });

    assert.equal(report.status, 'blocked');
    assert.match(report.blockers.join('\n'), /options or order differ/);
    assert.equal(
      client.calls.some((call) => call.operation === 'recolorIssueField'),
      false,
    );
  });

  it('should reject authorization for a different organization or digest', () => {
    const client = fakeFieldColorClient();
    const report = synchronizeGitHubIssueFieldColors('tanaabased/agent-system-test', {
      client,
      authorization: {
        approvedOrganization: 'another-org',
        approvedDigest: 'sha256:wrong',
      },
    });

    assert.equal(report.status, 'approval_required');
    assert.equal(report.authorization.approved, false);
    assert.equal(report.authorization.reasons.length, 2);
    assert.equal(report.mutatesGitHub, false);
  });
});
