import assert from 'node:assert/strict';

import { GitHubCapabilityClient } from '../lib/github-capability-client.js';
import { normalizeTaskTarget } from '../../../utils/normalize-task-target.js';
import { planTaskMetadata } from '../utils/plan-task-metadata.js';

function success(value = null) {
  return {
    status: 0,
    stdout: value === null ? '' : JSON.stringify(value),
    stderr: '',
    error: null,
  };
}

function failure(message) {
  return { status: 1, stdout: '', stderr: message, error: null };
}

const workSize = {
  id: 'IFSS_node',
  fullDatabaseId: '300',
  name: 'Work size',
  dataType: 'SINGLE_SELECT',
  options: [{ id: 'IFSSO_node', fullDatabaseId: '12', name: '5' }],
};

const startDate = {
  id: 'IFD_node',
  fullDatabaseId: '301',
  name: 'Start date',
  dataType: 'DATE',
};

function remote({
  ownerType = 'Organization',
  failFields = false,
  failNextPage = false,
  viewerPermission = 'ADMIN',
  visibilityError = false,
  fields = [workSize],
  types = [{ id: 1, name: 'Task', is_enabled: true }],
} = {}) {
  const calls = [];
  return {
    calls,
    runner(args) {
      calls.push([...args]);
      if (args[0] === '--version' || args[0] === 'auth') return success();
      if (args[0] === 'repo') return success({ nameWithOwner: 'acme/widgets' });

      const endpoint = args[1];
      if (endpoint === '/repos/acme/widgets') {
        return success({ private: false, owner: { login: 'acme', type: ownerType } });
      }
      if (endpoint === '/repos/acme/widgets/issue-types') {
        return success([types]);
      }
      if (endpoint === 'graphql') {
        const nextPage = args.includes('cursor=page-two');
        if (failFields || (nextPage && failNextPage)) {
          return failure('gh: Resource not accessible by integration (HTTP 403)');
        }
        const hasNextPage = !nextPage && fields.length > 1;
        const page = success({
          ...(visibilityError
            ? {
                errors: [
                  { message: 'Permission unavailable', path: ['repository', 'viewerPermission'] },
                ],
              }
            : {}),
          data: {
            repository: {
              viewerCanSeeIssueFields: true,
              viewerPermission,
              issueFields: {
                totalCount: fields.length,
                pageInfo: { hasNextPage, endCursor: hasNextPage ? 'page-two' : null },
                nodes: nextPage ? fields.slice(1) : fields.slice(0, 1),
              },
            },
          },
        });
        return { ...page, status: visibilityError ? 1 : 0 };
      }
      if (endpoint === '/repos/acme/widgets/labels?per_page=100') {
        return success([[{ name: 'needs triage' }]]);
      }
      throw new Error(`Unexpected command: ${args.join(' ')}`);
    },
  };
}

describe('Task Author GitHub capability client', () => {
  it('should use only read-only repository, issue-type, issue-field, and label requests', () => {
    const fake = remote();
    const client = new GitHubCapabilityClient({ runner: fake.runner });
    assert.deepEqual(client.ensureAvailable(), []);
    assert.equal(client.resolveCurrentRepository(), 'acme/widgets');

    const report = client.inspectRepository(normalizeTaskTarget('acme/widgets'));
    assert.equal(report.issueTypes.status, 'ok');
    assert.equal(report.issueFields.status, 'ok');
    assert.equal(report.labels.status, 'ok');
    assert.deepEqual(report.issueFields.values, [
      {
        id: 300,
        name: 'Work size',
        data_type: 'single_select',
        options: [{ id: 12, name: '5' }],
      },
    ]);

    const apiCalls = fake.calls.filter((args) => args[0] === 'api');
    assert.equal(apiCalls.length, 4);
    assert.equal(
      apiCalls.some((args) => args.includes('--method')),
      false,
    );
    assert.match(apiCalls.find((args) => args[1] === 'graphql')[3], /query RepositoryIssueFields/);
    assert.ok(apiCalls.every((args) => !args[1].startsWith('/orgs/')));
  });

  it('should surface optional permission failures as unresolved capabilities', () => {
    const fake = remote({ failFields: true });
    const report = new GitHubCapabilityClient({ runner: fake.runner }).inspectRepository(
      normalizeTaskTarget('acme/widgets'),
    );

    assert.equal(report.issueFields.status, 'unavailable');
    assert.match(report.warnings[0], /Resource not accessible/);
  });

  it('should use native metadata for a personal repo and fall back for proven gaps', () => {
    const fake = remote({ ownerType: 'User' });
    const report = new GitHubCapabilityClient({ runner: fake.runner }).inspectRepository(
      normalizeTaskTarget('acme/widgets'),
    );

    const placement = planTaskMetadata('task', { workSize: 5, complexity: 'medium' }, report);
    assert.equal(placement.native.type.name, 'Task');
    assert.deepEqual(
      placement.native.fields.map(({ id }) => id),
      [300],
    );
    assert.deepEqual(placement.fallback, { complexity: 'medium' });
    assert.deepEqual(placement.unresolved, []);
  });

  it('should paginate visible definitions and leave omitted fields unresolved for an app', () => {
    const fake = remote({ viewerPermission: null, fields: [startDate, workSize] });
    const report = new GitHubCapabilityClient({ runner: fake.runner }).inspectRepository(
      normalizeTaskTarget('acme/widgets'),
    );
    assert.ok(fake.calls.some((args) => args.includes('cursor=page-two')));
    const placement = planTaskMetadata('task', { workSize: 5, impact: 'high' }, report);
    assert.deepEqual(
      placement.native.fields.map(({ id }) => id),
      [300],
    );
    assert.deepEqual(placement.fallback, {});
    assert.deepEqual(
      placement.unresolved.map(({ key }) => key),
      ['impact'],
    );
  });

  it('should distinguish a confirmed missing option from failed pagination', () => {
    const target = normalizeTaskTarget('acme/widgets');
    const visible = remote({ viewerPermission: null });
    const limited = new GitHubCapabilityClient({ runner: visible.runner }).inspectRepository(
      target,
    );
    assert.deepEqual(planTaskMetadata('task', { workSize: 3 }, limited).fallback, {
      'work-size': 3,
    });

    const interrupted = remote({ fields: [startDate, workSize], failNextPage: true });
    const unavailable = new GitHubCapabilityClient({
      runner: interrupted.runner,
    }).inspectRepository(target);
    const placement = planTaskMetadata('task', { workSize: 5 }, unavailable);
    assert.deepEqual(placement.fallback, {});
    assert.deepEqual(
      placement.unresolved.map(({ key }) => key),
      ['work-size'],
    );
  });

  it('should retain known definitions when the viewer permission lookup itself fails', () => {
    const fake = remote({ visibilityError: true });
    const report = new GitHubCapabilityClient({ runner: fake.runner }).inspectRepository(
      normalizeTaskTarget('acme/widgets'),
    );
    const placement = planTaskMetadata('task', { workSize: 5, impact: 'high' }, report);
    assert.deepEqual(
      placement.native.fields.map(({ id }) => id),
      [300],
    );
    assert.deepEqual(placement.fallback, {});
    assert.deepEqual(
      placement.unresolved.map(({ key }) => key),
      ['impact'],
    );
  });

  it('should use fallback for a disabled repository issue type', () => {
    const fake = remote({ types: [{ id: 1, name: 'Task', is_enabled: false }] });
    const report = new GitHubCapabilityClient({ runner: fake.runner }).inspectRepository(
      normalizeTaskTarget('acme/widgets'),
    );
    assert.deepEqual(planTaskMetadata('task', {}, report).fallback, { type: 'task' });
  });
});
