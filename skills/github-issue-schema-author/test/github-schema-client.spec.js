import assert from 'node:assert/strict';
import { describe, it } from 'mocha';
import { GitHubSchemaClient, SCHEMA_INSPECTION_QUERY } from '../lib/github-schema-client.js';
import { makeField, makeIssueType, makeLabel, organizationPayload, result } from './fake-github.js';
import { inspectGitHubIssueSchema } from '../lib/schema-inspector.js';

function response(payload, status = 0) {
  return result({ stdout: JSON.stringify(payload), status });
}

function remote(first, { second, details = response(first), fields = response(first) } = {}) {
  const calls = [];
  const runner = (args) => {
    calls.push({ args });
    if (args[0] === '--version' || args[0] === 'auth') return result();
    if (args[1].endsWith('/issue-types')) {
      const types = first.data.repository.issueTypes?.nodes ?? [];
      return response([
        types.map(({ id, name, isEnabled }) => ({
          node_id: id,
          name,
          is_enabled: isEnabled,
        })),
      ]);
    }
    const query = args[3] ?? '';
    if (query.includes('query RepositoryIssueFields')) return fields;
    if (query.includes('query SchemaDetails')) return details;
    if (query.includes('query SchemaInspection')) {
      return args.includes('labelCursor=cursor-1') ? second : response(first);
    }
    throw new Error(`Unexpected command: gh ${args.join(' ')}`);
  };
  return { calls, runner };
}

describe('skills/github-issue-schema-author/lib/github-schema-client', () => {
  it('should use only a read-only GraphQL query', () => {
    assert.match(SCHEMA_INSPECTION_QUERY, /query SchemaInspection/);
    assert.doesNotMatch(SCHEMA_INSPECTION_QUERY, /\bmutation\b/i);

    const payload = organizationPayload({
      fields: [makeField({ name: 'Priority', options: ['Urgent', 'High', 'Medium', 'Low'] })],
      types: [makeIssueType('Task')],
      labels: [makeLabel({ name: 'documentation' })],
    });
    const fake = remote(payload);
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
    const fake = remote(first, { second: response(second) });
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

  it('should mark labels unavailable after a failed later page or unusable cursor', () => {
    for (const endCursor of ['cursor-1', null]) {
      const first = organizationPayload({
        labels: [makeLabel({ name: 'documentation' })],
        hasNextPage: true,
        endCursor,
      });
      const fake = remote(first, { second: result({ status: 1, stderr: 'Later page failed' }) });
      const report = new GitHubSchemaClient({ runner: fake.runner }).inspect({
        owner: 'tanaabased',
        repo: 'canon',
        slug: 'tanaabased/canon',
      });
      assert.equal(report.repositoryLabels.status, 'unavailable');
      assert.deepEqual(report.repositoryLabels.values, []);
    }
  });

  it('should reject partial label data even when page information is present', () => {
    const payload = organizationPayload({
      errors: [{ message: 'Label access failed', path: ['repository', 'labels', 'nodes'] }],
    });
    const fake = remote(payload);
    const report = new GitHubSchemaClient({ runner: fake.runner }).inspect({
      owner: 'tanaabased',
      repo: 'canon',
      slug: 'tanaabased/canon',
    });
    assert.equal(report.repositoryLabels.status, 'unavailable');
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
    const fake = remote(payload, { fields: response(payload, 1) });

    const report = new GitHubSchemaClient({ runner: fake.runner }).inspect({
      owner: 'tanaabased',
      repo: 'canon',
      slug: 'tanaabased/canon',
    });

    assert.equal(report.repositoryIssueFields.status, 'unavailable');
    assert.equal(report.issueFields.status, 'ok');
    assert.equal(report.repositoryLabels.status, 'ok');
    assert.match(report.warnings[0], /not visible/);
  });

  it('should mark organization-only schema surfaces not applicable for a personal repository', () => {
    const payload = organizationPayload({
      labels: [makeLabel({ name: 'documentation' })],
      fields: [makeField({ name: 'Work size' })],
      types: [makeIssueType('Task', [], false)],
    });
    payload.data.organization = null;
    payload.data.repository.nameWithOwner = 'pirog/canon';
    payload.data.repository.owner = { __typename: 'User', login: 'pirog' };
    const fake = remote(payload);

    const report = new GitHubSchemaClient({ runner: fake.runner }).inspect({
      owner: 'pirog',
      repo: 'canon',
      slug: 'pirog/canon',
    });

    assert.equal(report.organizationIssueTypes.status, 'not_applicable');
    assert.deepEqual(report.repositoryIssueTypes.values, [
      { id: 'type-Task', name: 'Task', enabled: false },
    ]);
    assert.deepEqual(
      report.repositoryIssueFields.values.map(({ name }) => name),
      ['Work size'],
    );
    assert.equal(report.issueFields.status, 'not_applicable');
    assert.equal(report.organizationDefaultLabels.status, 'not_applicable');
    assert.equal(report.repositoryLabels.status, 'ok');
  });

  it('should report repository fields and basic types when organization and per-type reads fail', () => {
    const field = makeField({ name: 'Work size' });
    const payload = organizationPayload({ fields: [field], types: [makeIssueType('Task')] });
    const detail = structuredClone(payload);
    detail.data.organization = null;
    detail.data.repository.issueTypes.nodes[0].pinnedFields = null;
    detail.errors = [
      { message: 'Organization read denied', path: ['organization'] },
      {
        message: 'Pin read denied',
        path: ['repository', 'issueTypes', 'nodes', 0, 'pinnedFields'],
      },
    ];
    const fake = remote(payload, { details: response(detail, 1) });
    const report = inspectGitHubIssueSchema('tanaabased/canon', {
      client: new GitHubSchemaClient({ runner: fake.runner }),
    });
    assert.equal(report.issueFields.status, 'unresolved');
    assert.deepEqual(
      report.repositoryIssueFields.values.map(({ name }) => name),
      ['Work size'],
    );
    assert.deepEqual(report.issueTypes.repository.values, [
      { id: 'type-Task', name: 'Task', enabled: true },
    ]);
    assert.equal(report.pinning.repository.status, 'unavailable');
    assert.deepEqual(report.pinning.repository.values, []);
  });
});
