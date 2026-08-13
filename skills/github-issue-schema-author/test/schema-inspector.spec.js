import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { inspectGitHubIssueSchema } from '../lib/schema-inspector.js';

function emptySurface(status = 'ok') {
  return { status, values: [] };
}

function observation(overrides = {}) {
  return {
    repository: {
      slug: 'tanaabased/canon',
      ownerLogin: 'tanaabased',
      ownerType: 'Organization',
      private: false,
      viewerCanSeeIssueFields: true,
    },
    organizationIssueTypes: emptySurface(),
    repositoryIssueTypes: emptySurface(),
    issueFields: emptySurface(),
    repositoryLabels: emptySurface(),
    organizationDefaultLabels: { status: 'manual', reason: 'No public listing API.' },
    warnings: [],
    ...overrides,
  };
}

function clientFor(value) {
  return { ensureAvailable: () => [], inspect: () => value };
}

describe('skills/github-issue-schema-author/lib/schema-inspector', () => {
  it('should return an inspect-only report with no proposed operations', () => {
    const report = inspectGitHubIssueSchema('tanaabased/canon', {
      client: clientFor(observation()),
    });

    assert.equal(report.mode, 'inspect');
    assert.equal(report.mutatesGitHub, false);
    assert.deepEqual(report.operations, []);
    assert.equal(report.status, 'missing');
    assert.equal(report.labels.organizationDefaults.status, 'manual');
  });

  it('should report inaccessible fields as unresolved while retaining other findings', () => {
    const report = inspectGitHubIssueSchema('tanaabased/canon', {
      client: clientFor(
        observation({
          issueFields: {
            status: 'unavailable',
            values: [],
            reason: 'viewer lacks issue field access',
          },
          warnings: ['viewer lacks issue field access'],
        }),
      ),
    });

    assert.equal(report.status, 'unresolved');
    assert.equal(report.issueFields.unresolved[0].reason, 'viewer lacks issue field access');
    assert.deepEqual(report.warnings, ['viewer lacks issue field access']);
  });

  it('should inspect repository labels for personal repositories while skipping organization schema', () => {
    const report = inspectGitHubIssueSchema('pirog/canon', {
      client: clientFor(
        observation({
          repository: {
            slug: 'pirog/canon',
            ownerLogin: 'pirog',
            ownerType: 'User',
            private: false,
            viewerCanSeeIssueFields: false,
          },
          organizationIssueTypes: emptySurface('not_applicable'),
          repositoryIssueTypes: emptySurface('not_applicable'),
          issueFields: emptySurface('not_applicable'),
          organizationDefaultLabels: {
            status: 'not_applicable',
            reason: 'Personal repository.',
          },
        }),
      ),
    });

    assert.equal(report.issueTypes.organization.status, 'not_applicable');
    assert.equal(report.issueFields.status, 'not_applicable');
    assert.equal(report.labels.repository.status, 'missing');
    assert.equal(report.status, 'missing');
  });
});
