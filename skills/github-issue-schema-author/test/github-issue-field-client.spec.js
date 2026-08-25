import assert from 'node:assert/strict';

import { GitHubIssueFieldClient } from '../lib/github-issue-field-client.js';

describe('skills/github-issue-schema-author/lib/github-issue-field-client', () => {
  it('should read and normalize organization options in priority order', () => {
    const calls = [];
    const runner = (args) => {
      calls.push({ args });
      return {
        status: 0,
        stdout: JSON.stringify([
          {
            id: 50,
            name: 'Complexity',
            description: 'Difficulty.',
            data_type: 'single_select',
            visibility: 'all',
            options: [
              { id: 2, name: 'High', description: '', color: 'gray', priority: 3 },
              { id: 1, name: 'Low', description: '', color: 'gray', priority: 1 },
            ],
          },
        ]),
        stderr: '',
      };
    };
    const client = new GitHubIssueFieldClient({ runner });

    const result = client.listIssueFields('tanaabased');

    assert.equal(result.ok, true);
    assert.deepEqual(
      result.value[0].options.map(({ id }) => id),
      [1, 2],
    );
    assert.deepEqual(calls[0].args.slice(0, 2), ['api', '/orgs/tanaabased/issue-fields']);
  });

  it('should retain endpoint context for a failed field read', () => {
    const client = new GitHubIssueFieldClient({
      runner: () => ({ status: 1, stdout: '', stderr: 'HTTP 403' }),
    });

    assert.deepEqual(client.listIssueFields('tanaabased'), {
      ok: false,
      error: 'GET /orgs/tanaabased/issue-fields: HTTP 403',
    });
  });

  it('should PATCH only the complete retained option array', () => {
    const calls = [];
    const runner = (args, options = {}) => {
      calls.push({ args, input: options.input });
      return { status: 0, stdout: JSON.stringify({ id: 50 }), stderr: '' };
    };
    const client = new GitHubIssueFieldClient({ runner });
    const options = [
      { id: 1, name: 'Low', description: '', color: 'green', priority: 1 },
      { id: 2, name: 'High', description: '', color: 'pink', priority: 2 },
    ];

    const result = client.recolorIssueField('tanaabased', 50, options);

    assert.equal(result.ok, true);
    assert.deepEqual(calls[0].args.slice(0, 4), [
      'api',
      '/orgs/tanaabased/issue-fields/50',
      '--method',
      'PATCH',
    ]);
    assert.deepEqual(JSON.parse(calls[0].input), { options });
    assert.equal(calls[0].args.includes('DELETE'), false);
  });

  it('should retain endpoint context for a failed color update', () => {
    const client = new GitHubIssueFieldClient({
      runner: () => ({ status: 1, stdout: '', stderr: 'gh: Forbidden (HTTP 403)' }),
    });
    const result = client.recolorIssueField('tanaabased', 50, []);

    assert.equal(result.ok, false);
    assert.match(result.error, /PATCH \/orgs\/tanaabased\/issue-fields\/50.*Forbidden/);
  });

  it('should POST only the additive field payload', () => {
    const calls = [];
    const runner = (args, options = {}) => {
      calls.push({ args, input: options.input ?? null });
      return { status: 0, stdout: JSON.stringify({ id: 512, name: 'Impact' }), stderr: '' };
    };
    const client = new GitHubIssueFieldClient({ runner });
    const payload = {
      name: 'Impact',
      description: 'Expected local value.',
      data_type: 'single_select',
      visibility: 'all',
      options: [{ name: 'Low', description: '', color: 'gray', priority: 1 }],
    };

    const result = client.createIssueField('tanaabased', payload);

    assert.equal(result.ok, true);
    assert.deepEqual(calls[0].args.slice(0, 4), [
      'api',
      '/orgs/tanaabased/issue-fields',
      '--method',
      'POST',
    ]);
    assert.equal(calls[0].args.includes('POST'), true);
    assert.deepEqual(JSON.parse(calls[0].input), payload);
    assert.equal(calls[0].args.includes('DELETE'), false);
  });

  it('should preserve numeric and node field identities needed by pinning', () => {
    const client = new GitHubIssueFieldClient({
      runner: () => ({
        status: 0,
        stdout: JSON.stringify([
          { id: 42, node_id: 'IFD_node', name: 'Start date', data_type: 'date' },
        ]),
        stderr: '',
      }),
    });

    const result = client.listIssueFields('tanaabased');

    assert.equal(result.ok, true);
    assert.equal(result.value[0].id, 42);
    assert.equal(result.value[0].nodeId, 'IFD_node');
    assert.equal(result.value[0].name, 'Start date');
  });

  it('should retain endpoint context for a failed field creation', () => {
    const client = new GitHubIssueFieldClient({
      runner: () => ({ status: 1, stdout: '', stderr: 'gh: Forbidden (HTTP 403)' }),
    });
    const result = client.createIssueField('tanaabased', { name: 'Impact' });

    assert.equal(result.ok, false);
    assert.match(result.error, /POST \/orgs\/tanaabased\/issue-fields.*Forbidden/);
  });

  it('should PATCH only field visibility', () => {
    const calls = [];
    const client = new GitHubIssueFieldClient({
      runner: (args, options = {}) => {
        calls.push({ args, input: options.input });
        return { status: 0, stdout: JSON.stringify({ id: 50, visibility: 'all' }), stderr: '' };
      },
    });

    const result = client.updateIssueFieldVisibility('tanaabased', 50, 'all');

    assert.equal(result.ok, true);
    assert.deepEqual(calls[0].args.slice(0, 4), [
      'api',
      '/orgs/tanaabased/issue-fields/50',
      '--method',
      'PATCH',
    ]);
    assert.deepEqual(JSON.parse(calls[0].input), { visibility: 'all' });
  });
});
