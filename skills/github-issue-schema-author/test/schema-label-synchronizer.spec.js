import assert from 'node:assert/strict';

import schema from '../../../references/task-management-schema.json' with { type: 'json' };
import { synchronizeGitHubIssueLabels } from '../lib/schema-label-synchronizer.js';
import { fakeLabelClient } from './fake-issue-field-client.js';

function approve(preview) {
  return {
    approvedRepository: preview.authorization.repository,
    approvedDigest: preview.authorization.digest,
  };
}

describe('GitHub Issue Schema Author canonical labels', () => {
  it('should create missing labels, update canonical definitions, and preserve everything else', () => {
    const labels = [
      {
        id: 'documentation',
        name: 'documentation',
        color: 'ffffff',
        description: 'old description',
        default: false,
        issueCount: 4,
        pullRequestCount: 2,
      },
      {
        id: 'custom',
        name: 'custom automation',
        color: 'abcdef',
        description: 'unmanaged',
        default: false,
        issueCount: 3,
        pullRequestCount: 0,
      },
    ];
    const preview = synchronizeGitHubIssueLabels('tanaabased/canon', {
      client: fakeLabelClient({ labels }),
    });
    assert.equal(preview.status, 'approval_required');
    assert.equal(preview.plannedMutation.creates.length, schema.labels.length - 1);
    assert.equal(preview.plannedMutation.updates.length, 1);
    assert.deepEqual(preview.plannedMutation.deletions, []);

    const client = fakeLabelClient({ labels });
    const report = synchronizeGitHubIssueLabels('tanaabased/canon', {
      client,
      authorization: approve(preview),
    });
    assert.equal(report.status, 'updated');
    assert.equal(report.verification.status, 'verified');
    assert.ok(
      report.verification.checks.some(
        ({ key, status }) => key === 'preserved-label:custom automation' && status === 'verified',
      ),
    );
    assert.ok(client.state.labels.some(({ name }) => name === 'custom automation'));
    const documentation = client.state.labels.find(({ name }) => name === 'documentation');
    assert.equal(documentation.issueCount, 4);
    assert.equal(documentation.pullRequestCount, 2);
  });

  it('should be idempotent after alignment', () => {
    const labels = schema.labels.map((label) => ({
      id: `label-${label.name}`,
      name: label.name,
      color: label.color,
      description: label.description,
      default: false,
      issueCount: 0,
      pullRequestCount: 0,
    }));
    const report = synchronizeGitHubIssueLabels('tanaabased/canon', {
      client: fakeLabelClient({ labels }),
    });
    assert.equal(report.status, 'aligned');
    assert.deepEqual(report.plannedMutation.operations, []);
  });
});
