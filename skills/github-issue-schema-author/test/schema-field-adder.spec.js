import assert from 'node:assert/strict';

import { addMissingGitHubIssueFields } from '../lib/schema-field-adder.js';
import {
  allManagedFields,
  fakeFieldAdditionClient,
  initialFields,
} from './fake-field-addition-client.js';

function authorize(preview) {
  return {
    approvedOrganization: preview.authorization.organization,
    approvedDigest: preview.authorization.digest,
  };
}

describe('skills/github-issue-schema-author/lib/schema-field-adder', () => {
  it('should preview exactly four additive POST operations and no updates or deletions', () => {
    const client = fakeFieldAdditionClient();
    const report = addMissingGitHubIssueFields('tanaabased/agent-system-test', { client });

    assert.equal(report.status, 'approval_required');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(
      report.plannedMutation.operations.map(({ body }) => body.name),
      ['Work size', 'Complexity', 'Impact', 'Task score'],
    );
    assert.ok(report.plannedMutation.operations.every(({ method }) => method === 'POST'));
    assert.deepEqual(report.plannedMutation.updates, []);
    assert.deepEqual(report.plannedMutation.deletions, []);
    assert.equal(
      client.calls.some((call) => call.operation === 'createIssueField'),
      false,
    );

    const workSize = report.plannedMutation.operations[0].body;
    assert.equal(workSize.visibility, 'all');
    assert.deepEqual(
      workSize.options.map(({ name, color, priority }) => ({ name, color, priority })),
      [
        { name: '1', color: 'green', priority: 1 },
        { name: '2', color: 'green', priority: 2 },
        { name: '3', color: 'green', priority: 3 },
        { name: '5', color: 'blue', priority: 4 },
        { name: '8', color: 'blue', priority: 5 },
        { name: '13', color: 'yellow', priority: 6 },
        { name: '21', color: 'red', priority: 7 },
      ],
    );
  });

  it('should create and exactly verify all four fields after digest-bound authorization', () => {
    const client = fakeFieldAdditionClient();
    const preview = addMissingGitHubIssueFields('tanaabased/agent-system-test', { client });
    const report = addMissingGitHubIssueFields('tanaabased/agent-system-test', {
      client,
      authorization: authorize(preview),
    });

    assert.equal(report.status, 'added');
    assert.equal(report.mutatesGitHub, true);
    assert.equal(report.writes.length, 4);
    assert.ok(report.writes.every(({ status }) => status === 'succeeded'));
    assert.equal(report.verification.status, 'verified');
    assert.equal(report.verification.mismatches.length, 0);
    assert.equal(client.calls.filter((call) => call.operation === 'createIssueField').length, 4);
  });

  it('should be idempotent after all four additive fields exist', () => {
    const client = fakeFieldAdditionClient({ fields: allManagedFields() });
    const report = addMissingGitHubIssueFields('tanaabased/agent-system-test', { client });

    assert.equal(report.status, 'aligned');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.plannedMutation.operations, []);
    assert.equal(
      client.calls.some((call) => call.operation === 'createIssueField'),
      false,
    );
  });

  it('should leave an incompatible existing field untouched while adding other missing fields', () => {
    const fields = [
      ...initialFields(),
      {
        id: 'wrong-work-size',
        name: 'Work size',
        description: '',
        dataType: 'text',
        visibility: 'all',
        options: [],
      },
    ];
    const client = fakeFieldAdditionClient({ fields });
    const report = addMissingGitHubIssueFields('tanaabased/agent-system-test', { client });

    assert.deepEqual(
      report.plannedMutation.operations.map(({ body }) => body.name),
      ['Complexity', 'Impact', 'Task score'],
    );
    assert.ok(
      report.inspection.issueFields.migrationRequired.some(
        ({ desired }) => desired.name === 'Work size',
      ),
    );
    assert.deepEqual(report.plannedMutation.updates, []);
  });

  it('should stop on the first failed creation and preserve partial success without rollback', () => {
    const client = fakeFieldAdditionClient({ failAt: 2 });
    const preview = addMissingGitHubIssueFields('tanaabased/agent-system-test', { client });
    const report = addMissingGitHubIssueFields('tanaabased/agent-system-test', {
      client,
      authorization: authorize(preview),
    });

    assert.equal(report.status, 'partial');
    assert.equal(report.mutatesGitHub, true);
    assert.deepEqual(
      report.writes.map(({ status }) => status),
      ['succeeded', 'failed'],
    );
    assert.equal(client.calls.filter((call) => call.operation === 'createIssueField').length, 2);
    assert.equal(report.verification.status, 'drifted');
    assert.equal(report.plannedMutation.deletions.length, 0);
    assert.ok(client.state.fields.some(({ name }) => name === 'Work size'));
  });

  it('should block personal repositories and unresolved organization field inspection', () => {
    for (const client of [
      fakeFieldAdditionClient({ ownerType: 'User' }),
      fakeFieldAdditionClient({ fieldsStatus: 'unavailable' }),
    ]) {
      const report = addMissingGitHubIssueFields('tanaabased/agent-system-test', { client });
      assert.equal(report.status, 'blocked');
      assert.equal(report.mutatesGitHub, false);
      assert.equal(
        client.calls.some((call) => call.operation === 'createIssueField'),
        false,
      );
    }
  });

  it('should reject an approval for a different organization or plan digest', () => {
    const client = fakeFieldAdditionClient();
    const report = addMissingGitHubIssueFields('tanaabased/agent-system-test', {
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
