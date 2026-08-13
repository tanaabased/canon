import assert from 'node:assert/strict';

import { synchronizeGitHubIssueFieldVisibility } from '../lib/schema-field-synchronizer.js';
import { fakeFieldVisibilityClient } from './fake-issue-field-client.js';

function approve(preview) {
  return {
    approvedOrganization: preview.authorization.organization,
    approvedDigest: preview.authorization.digest,
  };
}

describe('GitHub Issue Schema Author visibility synchronization', () => {
  it('should separately authorize and verify visibility-only changes', () => {
    const preview = synchronizeGitHubIssueFieldVisibility('tanaabased/canon', {
      client: fakeFieldVisibilityClient(),
    });
    assert.equal(preview.status, 'approval_required');
    assert.deepEqual(
      preview.plannedMutation.operations.map(({ field }) => field.name),
      ['Work size', 'Complexity', 'Impact', 'Task score'],
    );
    assert.ok(
      preview.plannedMutation.operations.every(
        ({ body }) =>
          JSON.stringify(body) === JSON.stringify({ visibility: 'organization_members_only' }),
      ),
    );

    const client = fakeFieldVisibilityClient();
    const report = synchronizeGitHubIssueFieldVisibility('tanaabased/canon', {
      client,
      authorization: approve(preview),
    });
    assert.equal(report.status, 'updated');
    assert.equal(report.verification.status, 'verified');
    assert.ok(
      report.verification.checks.some(
        ({ key, status }) => key === 'preserved-field:Effort' && status === 'verified',
      ),
    );
    assert.ok(
      client.state.fields.every(({ visibility }) => visibility === 'organization_members_only'),
    );

    const aligned = synchronizeGitHubIssueFieldVisibility('tanaabased/canon', { client });
    assert.equal(aligned.status, 'aligned');
  });

  it('should stop after the first failed visibility write', () => {
    const preview = synchronizeGitHubIssueFieldVisibility('tanaabased/canon', {
      client: fakeFieldVisibilityClient(),
    });
    const report = synchronizeGitHubIssueFieldVisibility('tanaabased/canon', {
      client: fakeFieldVisibilityClient({ failAt: 2 }),
      authorization: approve(preview),
    });
    assert.equal(report.status, 'partial');
    assert.equal(report.writes.length, 2);
  });
});
