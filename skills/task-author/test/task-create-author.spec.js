import assert from 'node:assert/strict';

import { createTask } from '../lib/task-create-author.js';
import { fakeGitHubTaskClient } from './fake-github-task-client.js';
import fixtures, { organizationCapabilities } from '../../../test/task-management-fixtures.js';

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

describe('Task Author T01-T06 create fixtures', () => {
  for (const fixture of fixtures.filter(({ id }) => /^T0[1-6]$/.test(id))) {
    it(`should preview, create, and verify ${fixture.id}`, () => {
      const previewClient = fakeGitHubTaskClient(fixture.capabilities);
      const preview = createTask(fixture.input, { githubClient: previewClient });

      assert.equal(preview.status, 'approval_required');
      assert.equal(preview.mutatesGitHub, false);
      assert.match(preview.publication.digest, /^sha256:[a-f0-9]{64}$/);
      assert.equal(
        previewClient.calls.some((call) => call.operation === 'createIssue'),
        false,
      );

      const client = fakeGitHubTaskClient(fixture.capabilities);
      const report = createTask(approve(fixture.input, preview), { githubClient: client });

      assert.equal(report.status, 'created');
      assert.equal(report.mutatesGitHub, true);
      assert.equal(report.verification.status, 'verified');
      assert.equal(report.verification.mismatches.length, 0);
      assert.match(report.issue.url, /\/issues\/41$/);
      assert.deepEqual(
        client.state.issue.labels.map(({ name }) => name),
        fixture.expected.labels,
      );

      if (fixture.capabilities.repository.ownerType === 'User') {
        assert.equal(report.plannedMutation.issue.type, undefined);
        assert.equal(report.plannedMutation.issue.issue_field_values, undefined);
        assert.match(report.plannedMutation.issue.body, /schema: tanaab\/task-metadata\/v1/);
      } else {
        assert.equal(report.plannedMutation.issue.type, fixture.input.kind);
        assert.equal(
          report.plannedMutation.issue.issue_field_values.length,
          fixture.expected.nativeFields,
        );
      }
    });
  }

  it('should fail closed when the exact plan digest is not approved', () => {
    const fixture = fixtures.find(({ id }) => id === 'T01');
    const client = fakeGitHubTaskClient(fixture.capabilities);
    const report = createTask(
      {
        ...fixture.input,
        publication: {
          safetyReviewed: true,
          approvedTarget: fixture.input.target,
          approvedDigest: 'sha256:wrong',
        },
      },
      { githubClient: client },
    );

    assert.equal(report.status, 'approval_required');
    assert.equal(report.mutatesGitHub, false);
    assert.equal(
      client.calls.some((call) => call.operation === 'createIssue'),
      false,
    );
  });

  it('should block credential-shaped publication text before mutation', () => {
    const fixture = fixtures.find(({ id }) => id === 'T01');
    const input = {
      ...fixture.input,
      sections: {
        ...fixture.input.sections,
        context: 'Leaked token ghp_abcdefghijklmnopqrstuvwxyz123456 must never be published.',
      },
    };
    const client = fakeGitHubTaskClient(fixture.capabilities);
    const report = createTask(input, { githubClient: client });

    assert.equal(report.status, 'publication_blocked');
    assert.deepEqual(report.publication.findings, ['GitHub token']);
    assert.equal(
      client.calls.some((call) => call.operation === 'createIssue'),
      false,
    );
  });

  it('should block unresolved native-versus-fallback placement', () => {
    const fixture = fixtures.find(({ id }) => id === 'T01');
    const capabilities = organizationCapabilities();
    capabilities.issueFields = { status: 'unavailable', values: [] };
    capabilities.warnings = ['Could not inspect organization issue fields: HTTP 403'];
    const client = fakeGitHubTaskClient(capabilities);
    const report = createTask(fixture.input, { githubClient: client });

    assert.equal(report.status, 'blocked');
    assert.ok(report.blockers.some((blocker) => blocker.includes('placement remains unresolved')));
    assert.equal(
      client.calls.some((call) => call.operation === 'createIssue'),
      false,
    );
  });

  it('should block unsupported assignee, milestone, and relationship requests', () => {
    const fixture = fixtures.find(({ id }) => id === 'T01');
    const client = fakeGitHubTaskClient(fixture.capabilities);
    const report = createTask(
      {
        ...fixture.input,
        assignees: ['octocat'],
        milestone: 1,
        relationships: { blockedBy: 'acme/widgets#40' },
      },
      { githubClient: client },
    );

    assert.equal(report.status, 'blocked');
    assert.ok(report.blockers.some((blocker) => blocker.includes('Relationship writes')));
    assert.ok(report.blockers.some((blocker) => blocker.includes('Assignee and milestone')));
    assert.equal(
      client.calls.some((call) => call.operation === 'createIssue'),
      false,
    );
  });

  it('should report silently dropped managed values as partial success', () => {
    const fixture = fixtures.find(({ id }) => id === 'T02');
    const preview = createTask(fixture.input, {
      githubClient: fakeGitHubTaskClient(fixture.capabilities),
    });
    const client = fakeGitHubTaskClient(fixture.capabilities, {
      dropType: true,
      dropFields: true,
      dropLabels: true,
    });
    const report = createTask(approve(fixture.input, preview), { githubClient: client });

    assert.equal(report.status, 'partial');
    assert.equal(report.mutatesGitHub, true);
    assert.ok(report.verification.mismatches.some(({ key }) => key === 'type'));
    assert.ok(report.verification.mismatches.some(({ key }) => key === 'labels'));
    assert.ok(report.verification.mismatches.some(({ key }) => key === 'field:Priority'));
  });

  it('should preserve the issue URL when a follow-up comment fails', () => {
    const fixture = fixtures.find(({ id }) => id === 'T01');
    const preview = createTask(fixture.input, {
      githubClient: fakeGitHubTaskClient(fixture.capabilities),
    });
    const client = fakeGitHubTaskClient(fixture.capabilities, {
      commentFailure: 'POST comment: HTTP 403',
    });
    const report = createTask(approve(fixture.input, preview), { githubClient: client });

    assert.equal(report.status, 'partial');
    assert.equal(report.issue.url, 'https://github.com/acme/widgets/issues/41');
    assert.ok(report.writes.some(({ status }) => status === 'failed'));
    assert.ok(report.verification.mismatches.some(({ key }) => key === 'comment:task-score'));
  });
});
