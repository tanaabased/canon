import assert from 'node:assert/strict';

import { migrateTaskFallback } from '../lib/task-fallback-migrator.js';
import { renderFallbackMetadata } from '../utils/render-fallback-metadata.js';
import { fakeGitHubTaskClient } from './fake-github-task-client.js';
import { organizationCapabilities } from '../../../test/task-management-fixtures.js';

function issue(body) {
  return {
    number: 91,
    html_url: 'https://github.com/acme/widgets/issues/91',
    title: 'migrate fallback metadata',
    body,
    type: { name: 'Task' },
    labels: [{ name: 'documentation' }],
  };
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

describe('skills/task-author/lib/task-fallback-migrator', () => {
  it('should preserve current fields while verifying native values before capsule removal', () => {
    const capabilities = organizationCapabilities();
    const priorityField = capabilities.issueFields.values.find(({ name }) => name === 'Priority');
    const body = `## Context

Migration fixture.

### Task metadata

\`\`\`yaml
schema: tanaab/task-metadata/v1
mode: fallback
fallback:
  complexity: medium
  impact: high
  task-score: 52
\`\`\`
`;
    const options = {
      initialIssue: issue(body),
      initialFields: [
        {
          issue_field_id: priorityField.id,
          issue_field_name: 'Priority',
          data_type: 'single_select',
          value: null,
          single_select_option: { name: 'Medium' },
        },
      ],
      initialComments: [{ id: 1, body: 'Task score: 52 (`task-score/v1`)\n' }],
    };
    const input = { target: 'acme/widgets#91' };
    const preview = migrateTaskFallback(input, {
      githubClient: fakeGitHubTaskClient(capabilities, options),
    });

    assert.equal(preview.status, 'approval_required');
    assert.deepEqual(preview.plannedMutation.removableKeys, ['complexity', 'impact']);
    assert.deepEqual(preview.plannedMutation.retiredKeys, ['task-score']);
    assert.equal(preview.plannedMutation.phases[0].mutation.issue_field_values.length, 3);

    const client = fakeGitHubTaskClient(capabilities, options);
    const report = migrateTaskFallback(approve(input, preview), { githubClient: client });
    assert.equal(report.status, 'migrated');
    assert.equal(report.verification.status, 'verified');
    assert.doesNotMatch(client.state.issue.body, /Task metadata/);
    assert.equal(client.state.fields.length, 3);
    assert.equal(
      client.state.fields.find(({ issue_field_name: name }) => name === 'Priority')
        .single_select_option.name,
      'Medium',
    );
    assert.equal(client.state.comments.length, 1);
    assert.deepEqual(
      client.calls
        .filter(({ operation } = {}) => operation === 'updateIssue')
        .map(({ payload }) => Object.keys(payload)),
      [['issue_field_values'], ['body']],
    );
  });

  it('should retain fallback text when GitHub drops a native value', () => {
    const capabilities = organizationCapabilities();
    const body = `## Context\n\nMigration fixture.\n\n${renderFallbackMetadata({ impact: 'high' })}`;
    const options = { initialIssue: issue(body), dropFields: true };
    const input = { target: 'acme/widgets#91' };
    const preview = migrateTaskFallback(input, {
      githubClient: fakeGitHubTaskClient(capabilities, options),
    });
    const client = fakeGitHubTaskClient(capabilities, options);
    const report = migrateTaskFallback(approve(input, preview), { githubClient: client });

    assert.equal(report.status, 'partial');
    assert.match(client.state.issue.body, /impact: high/);
    assert.equal(
      client.calls.filter(({ operation } = {}) => operation === 'updateIssue').length,
      1,
    );
  });

  it('should preserve a conflicting native value and its fallback key', () => {
    const capabilities = organizationCapabilities();
    const body = `## Context\n\nMigration fixture.\n\n${renderFallbackMetadata({ impact: 'high' })}`;
    const impactField = capabilities.issueFields.values.find(({ name }) => name === 'Impact');
    const options = {
      initialIssue: issue(body),
      initialFields: [
        {
          issue_field_id: impactField.id,
          issue_field_name: 'Impact',
          data_type: 'single_select',
          value: null,
          single_select_option: { name: 'Low' },
        },
      ],
    };
    const report = migrateTaskFallback(
      { target: 'acme/widgets#91' },
      { githubClient: fakeGitHubTaskClient(capabilities, options) },
    );

    assert.equal(report.status, 'partial');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.plannedMutation.conflicts, [
      { key: 'impact', native: 'Low', fallback: 'high' },
    ]);
    assert.match(report.current.issue.body, /impact: high/);
  });
});
