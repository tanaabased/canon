import assert from 'node:assert/strict';

import { addMissingGitHubIssueFields } from '../lib/schema-field-synchronizer.js';
import {
  allManagedFields,
  fakeFieldAdditionClient,
  initialFields,
} from './fake-issue-field-client.js';

function authorize(preview) {
  return {
    approvedOrganization: preview.authorization.organization,
    approvedDigest: preview.authorization.digest,
  };
}

describe('skills/github-issue-schema-author/lib/schema-field-synchronizer additions', () => {
  it('should preview exactly three additive POST operations and no updates or deletions', () => {
    const client = fakeFieldAdditionClient();
    const report = addMissingGitHubIssueFields('tanaabased/big-test-bucket', { client });

    assert.equal(report.status, 'approval_required');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(
      report.plannedMutation.operations.map(({ body }) => body.name),
      ['Work size', 'Complexity', 'Impact'],
    );
    assert.ok(report.plannedMutation.operations.every(({ method }) => method === 'POST'));
    assert.deepEqual(report.plannedMutation.updates, []);
    assert.deepEqual(report.plannedMutation.deletions, []);
    assert.equal(
      client.calls.some((call) => call.operation === 'createIssueField'),
      false,
    );

    const workSize = report.plannedMutation.operations[0].body;
    assert.equal(workSize.visibility, 'organization_members_only');
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

  it('should create and exactly verify all three fields after digest-bound authorization', () => {
    const client = fakeFieldAdditionClient();
    const preview = addMissingGitHubIssueFields('tanaabased/big-test-bucket', { client });
    const report = addMissingGitHubIssueFields('tanaabased/big-test-bucket', {
      client,
      authorization: authorize(preview),
    });

    assert.equal(report.status, 'added');
    assert.equal(report.mutatesGitHub, true);
    assert.equal(report.writes.length, 3);
    assert.ok(report.writes.every(({ status }) => status === 'succeeded'));
    assert.equal(report.verification.status, 'verified');
    assert.equal(report.verification.mismatches.length, 0);
    assert.equal(client.calls.filter((call) => call.operation === 'createIssueField').length, 3);
  });

  it('should be idempotent after all three additive fields exist', () => {
    const client = fakeFieldAdditionClient({ fields: allManagedFields() });
    const report = addMissingGitHubIssueFields('tanaabased/big-test-bucket', { client });

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
    const report = addMissingGitHubIssueFields('tanaabased/big-test-bucket', { client });

    assert.deepEqual(
      report.plannedMutation.operations.map(({ body }) => body.name),
      ['Complexity', 'Impact'],
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
    const preview = addMissingGitHubIssueFields('tanaabased/big-test-bucket', { client });
    const report = addMissingGitHubIssueFields('tanaabased/big-test-bucket', {
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

  it('should block an unresolved owner field inventory', () => {
    for (const client of [
      fakeFieldAdditionClient({ ownerType: 'User', fieldsStatus: 'unavailable' }),
      fakeFieldAdditionClient({ fieldsStatus: 'unavailable' }),
    ]) {
      const report = addMissingGitHubIssueFields('tanaabased/big-test-bucket', { client });
      assert.equal(report.status, 'blocked');
      assert.equal(report.mutatesGitHub, false);
      assert.equal(report.authorization.digest, null);
      assert.deepEqual(report.plannedMutation.operations, []);
      assert.equal(
        client.calls.some((call) => call.operation === 'createIssueField'),
        false,
      );
    }
  });

  it('should require a fresh personal-account approval and preserve existing definitions', () => {
    const target = 'example-owner/example-repo';
    const client = fakeFieldAdditionClient({ ownerType: 'User' });
    const originalFields = structuredClone(client.state.fields);
    const preview = addMissingGitHubIssueFields(target, { client });
    const plan = preview.plannedMutation;

    assert.equal(preview.status, 'approval_required');
    assert.equal(plan.account, 'example-owner');
    assert.deepEqual(
      plan.operations.map(({ method, endpoint, body }) => [
        method,
        endpoint,
        body.name,
        body.visibility,
      ]),
      ['Work size', 'Complexity', 'Impact'].map((name) => [
        'POST',
        '/user/issue-fields',
        name,
        'restricted',
      ]),
    );
    const personalApproval = {
      approvedAccount: plan.account,
      approvedDigest: preview.authorization.digest,
    };
    const wrongApproval = addMissingGitHubIssueFields(target, {
      client,
      authorization: {
        approvedOrganization: plan.account,
        approvedDigest: personalApproval.approvedDigest,
      },
    });
    assert.equal(wrongApproval.status, 'approval_required');
    assert.equal(wrongApproval.mutatesGitHub, false);

    // Another process added one field after the preview. The stale approval cannot authorize the smaller plan.
    client.createPersonalIssueField({ login: plan.account }, plan.operations[0].body);
    const refreshed = addMissingGitHubIssueFields(target, {
      client,
      authorization: personalApproval,
    });
    assert.equal(refreshed.status, 'approval_required');
    assert.deepEqual(
      refreshed.plannedMutation.operations.map(({ body }) => body.name),
      ['Complexity', 'Impact'],
    );
    assert.equal(refreshed.mutatesGitHub, false);

    const applied = addMissingGitHubIssueFields(target, {
      client,
      authorization: { ...personalApproval, approvedDigest: refreshed.authorization.digest },
    });
    assert.equal(applied.status, 'added');
    assert.equal(applied.verification.account.status, 'verified');
    assert.equal(applied.verification.repository.status, 'verified');
    assert.deepEqual(client.state.fields.slice(0, originalFields.length), originalFields);
    const secondPlan = addMissingGitHubIssueFields(target, { client });
    assert.equal(secondPlan.status, 'aligned');
    assert.deepEqual(secondPlan.plannedMutation.operations, []);
  });

  it('should report partial success when the personal fields cannot be verified through the selected repository', () => {
    const target = 'example-owner/example-repo';
    const client = fakeFieldAdditionClient({ ownerType: 'User', repositoryFieldsVisible: false });
    const preview = addMissingGitHubIssueFields(target, { client });
    const report = addMissingGitHubIssueFields(target, {
      client,
      authorization: {
        approvedAccount: preview.account,
        approvedDigest: preview.authorization.digest,
      },
    });

    assert.equal(report.status, 'partial');
    assert.equal(report.mutatesGitHub, true);
    assert.equal(report.verification.account.status, 'verified');
    assert.equal(report.verification.repository.status, 'unavailable');

    const retry = addMissingGitHubIssueFields(target, { client });
    assert.equal(retry.status, 'blocked');
    assert.equal(retry.verification.status, 'unavailable');
    assert.equal(retry.mutatesGitHub, false);
    assert.deepEqual(retry.writes, []);

    const inspect = client.inspect;
    client.inspect = (value) => ({
      ...inspect(value),
      repositoryIssueFields: { status: 'ok', values: [] },
    });
    const drift = addMissingGitHubIssueFields(target, { client });
    assert.equal(drift.status, 'blocked');
    assert.equal(drift.verification.repository.status, 'drifted');
    assert.deepEqual(drift.writes, []);
  });

  it('should reject an approval for a different organization or plan digest', () => {
    const client = fakeFieldAdditionClient();
    const report = addMissingGitHubIssueFields('tanaabased/big-test-bucket', {
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
