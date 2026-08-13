import assert from 'node:assert/strict';

import { GitHubCapabilityClient } from '../lib/github-capability-client.js';
import { normalizeTaskTarget } from '../utils/normalize-task-target.js';

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

function remote({ ownerType = 'Organization', failFields = false } = {}) {
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
        return success([[{ id: 1, name: 'Task' }]]);
      }
      if (endpoint === '/orgs/acme/issue-fields?per_page=100') {
        return failFields
          ? failure('gh: Resource not accessible by integration (HTTP 403)')
          : success([{ fields: [{ id: 'priority', name: 'Priority' }] }]);
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
    assert.equal(report.issueFields.values[0].name, 'Priority');

    const apiCalls = fake.calls.filter((args) => args[0] === 'api');
    assert.equal(apiCalls.length, 4);
    assert.equal(
      apiCalls.some((args) => args.includes('--method')),
      false,
    );
    assert.equal(
      apiCalls.some((args) => args.includes('-f')),
      false,
    );
    assert.equal(
      apiCalls.some((args) => args.includes('-F')),
      false,
    );
  });

  it('should surface optional permission failures as unresolved capabilities', () => {
    const fake = remote({ failFields: true });
    const report = new GitHubCapabilityClient({ runner: fake.runner }).inspectRepository(
      normalizeTaskTarget('acme/widgets'),
    );

    assert.equal(report.issueFields.status, 'unavailable');
    assert.match(report.warnings[0], /Resource not accessible/);
  });

  it('should classify organization-only types and fields as not applicable for a user owner', () => {
    const fake = remote({ ownerType: 'User' });
    const report = new GitHubCapabilityClient({ runner: fake.runner }).inspectRepository(
      normalizeTaskTarget('acme/widgets'),
    );

    assert.equal(report.issueTypes.status, 'not_applicable');
    assert.equal(report.issueFields.status, 'not_applicable');
    assert.equal(
      fake.calls.some((args) => args[1]?.includes('issue-types')),
      false,
    );
    assert.equal(
      fake.calls.some((args) => args[1]?.includes('issue-fields')),
      false,
    );
  });
});
