import assert from 'node:assert/strict';

import { planGitHubIssueFieldPinning } from '../lib/schema-field-pinning-planner.js';
import { fakeFieldPinningClient } from './fake-issue-field-client.js';

function authorize(preview) {
  return {
    approvedOrganization: preview.authorization.organization,
    approvedDigest: preview.authorization.digest,
  };
}

describe('skills/github-issue-schema-author/lib/schema-field-pinning-planner', () => {
  it('should preview only the five canonical pin replacements that currently drift', () => {
    const report = planGitHubIssueFieldPinning('tanaabased/big-test-bucket', {
      client: fakeFieldPinningClient(),
    });

    assert.equal(report.status, 'approval_required');
    assert.equal(report.mutatesGitHub, false);
    assert.equal(report.plannedMutation.executionSurface, 'github_settings_ui');
    assert.deepEqual(
      report.plannedMutation.operations.map(({ field }) => field.name),
      ['Work size', 'Complexity', 'Impact', 'Start date', 'Target date'],
    );
    assert.deepEqual(report.plannedMutation.creates, []);
    assert.deepEqual(report.plannedMutation.deletions, []);
    assert.deepEqual(report.plannedMutation.operations[3].before.pinnedIssueTypes, ['Feature']);
    assert.deepEqual(
      report.plannedMutation.operations[3].after.pinnedIssueTypes.map(({ name }) => name),
      ['Task', 'Bug', 'Feature'],
    );
    assert.ok(
      report.plannedMutation.operations.every(
        ({ after, surface }) =>
          surface === 'github_settings_ui' && after.pinToNoTypeIssues === false,
      ),
    );
    assert.ok(report.plannedMutation.projectedIssueTypes.every(({ count }) => count === 7));
  });

  it('should become ready for browser execution only after exact digest authorization', () => {
    const client = fakeFieldPinningClient();
    const preview = planGitHubIssueFieldPinning('tanaabased/big-test-bucket', { client });
    const report = planGitHubIssueFieldPinning('tanaabased/big-test-bucket', {
      client,
      authorization: authorize(preview),
    });

    assert.equal(report.status, 'ready_for_browser');
    assert.equal(report.authorization.approved, true);
    assert.equal(report.mutatesGitHub, false);
  });

  it('should be idempotent when every managed field is already pinned', () => {
    const report = planGitHubIssueFieldPinning('tanaabased/big-test-bucket', {
      client: fakeFieldPinningClient({ canonical: true }),
    });

    assert.equal(report.status, 'aligned');
    assert.deepEqual(report.plannedMutation.operations, []);
  });

  it('should block a projection that exceeds GitHub pin limits', () => {
    const report = planGitHubIssueFieldPinning('tanaabased/big-test-bucket', {
      client: fakeFieldPinningClient({
        extraPinnedNames: ['Owner', 'Severity', 'Customer', 'Area'],
      }),
    });

    assert.equal(report.status, 'blocked');
    assert.match(report.blockers.join('\n'), /would have 11 pinned fields/);
  });

  it('should reject authorization for a different organization and digest', () => {
    const report = planGitHubIssueFieldPinning('tanaabased/big-test-bucket', {
      client: fakeFieldPinningClient(),
      authorization: {
        approvedOrganization: 'another-org',
        approvedDigest: 'sha256:wrong',
      },
    });

    assert.equal(report.status, 'approval_required');
    assert.equal(report.authorization.approved, false);
    assert.equal(report.authorization.reasons.length, 2);
  });
});
