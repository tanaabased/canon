import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { GitHubSchemaClient, SCHEMA_INSPECTION_QUERY } from '../lib/github-schema-client.js';
import {
  createQueuedRunner,
  makeField,
  makeIssueType,
  makeLabel,
  organizationPayload,
  result,
} from './fake-github.js';

describe('skills/github-issue-schema-author/lib/github-schema-client', () => {
  it('should use only a read-only GraphQL query', () => {
    assert.match(SCHEMA_INSPECTION_QUERY, /query SchemaInspection/);
    assert.doesNotMatch(SCHEMA_INSPECTION_QUERY, /\bmutation\b/i);

    const payload = organizationPayload({
      fields: [makeField({ name: 'Priority', options: ['Urgent', 'High', 'Medium', 'Low'] })],
      types: [makeIssueType('Task')],
      labels: [makeLabel({ name: 'documentation' })],
    });
    const fake = createQueuedRunner([
      result({ stdout: 'gh version' }),
      result({ stdout: 'authenticated' }),
      result({ stdout: JSON.stringify(payload) }),
    ]);
    const client = new GitHubSchemaClient({ runner: fake.runner });

    assert.deepEqual(client.ensureAvailable(), []);
    const report = client.inspect({ owner: 'tanaabased', repo: 'canon', slug: 'tanaabased/canon' });

    assert.equal(report.repository.slug, 'tanaabased/canon');
    assert.deepEqual(fake.calls[2].args.slice(0, 2), ['api', 'graphql']);
    assert.ok(fake.calls[2].args.some((arg) => arg.includes('query=\n  query SchemaInspection')));
    assert.ok(fake.calls.every(({ args }) => !args.includes('--method')));
  });

  it('should paginate repository labels and preserve association counts', () => {
    const first = organizationPayload({
      labels: [makeLabel({ name: 'documentation', issueCount: 3 })],
      hasNextPage: true,
      endCursor: 'cursor-1',
    });
    const second = organizationPayload({
      labels: [makeLabel({ name: 'blocked', pullRequestCount: 2 })],
    });
    const fake = createQueuedRunner([
      result({ stdout: JSON.stringify(first) }),
      result({ stdout: JSON.stringify(second) }),
    ]);
    const client = new GitHubSchemaClient({ runner: fake.runner });

    const report = client.inspect({ owner: 'tanaabased', repo: 'canon', slug: 'tanaabased/canon' });

    assert.deepEqual(
      report.repositoryLabels.values.map(({ name }) => name),
      ['documentation', 'blocked'],
    );
    assert.equal(report.repositoryLabels.values[0].issueCount, 3);
    assert.equal(report.repositoryLabels.values[1].pullRequestCount, 2);
    assert.ok(fake.calls[1].args.includes('labelCursor=cursor-1'));
  });

  it('should retain partial repository data when issue fields are unavailable', () => {
    const payload = organizationPayload({
      labels: [makeLabel({ name: 'documentation' })],
      errors: [
        {
          message: 'Issue fields are not visible to this viewer.',
          path: ['repository', 'issueFields'],
        },
      ],
    });
    payload.data.repository.issueFields = null;
    const fake = createQueuedRunner([
      result({
        status: 1,
        stdout: JSON.stringify(payload),
        stderr: 'GraphQL returned partial data',
      }),
    ]);

    const report = new GitHubSchemaClient({ runner: fake.runner }).inspect({
      owner: 'tanaabased',
      repo: 'canon',
      slug: 'tanaabased/canon',
    });

    assert.equal(report.issueFields.status, 'unavailable');
    assert.equal(report.repositoryLabels.status, 'ok');
    assert.match(report.warnings[0], /not visible/);
  });

  it('should mark organization-only schema surfaces not applicable for a personal repository', () => {
    const payload = organizationPayload({ labels: [makeLabel({ name: 'documentation' })] });
    payload.data.organization = null;
    payload.data.repository.nameWithOwner = 'pirog/canon';
    payload.data.repository.owner = { __typename: 'User', login: 'pirog' };
    payload.data.repository.issueFields = null;
    payload.data.repository.issueTypes = null;
    const fake = createQueuedRunner([result({ stdout: JSON.stringify(payload) })]);

    const report = new GitHubSchemaClient({ runner: fake.runner }).inspect({
      owner: 'pirog',
      repo: 'canon',
      slug: 'pirog/canon',
    });

    assert.equal(report.organizationIssueTypes.status, 'not_applicable');
    assert.equal(report.repositoryIssueTypes.status, 'not_applicable');
    assert.equal(report.issueFields.status, 'not_applicable');
    assert.equal(report.organizationDefaultLabels.status, 'not_applicable');
    assert.equal(report.repositoryLabels.status, 'ok');
  });
});
