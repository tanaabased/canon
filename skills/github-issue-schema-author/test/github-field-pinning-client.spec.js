import assert from 'node:assert/strict';

import { GitHubFieldPinningClient } from '../lib/github-field-pinning-client.js';

describe('skills/github-issue-schema-author/lib/github-field-pinning-client', () => {
  it('should read only numeric and node field identities from the organization endpoint', () => {
    const calls = [];
    const runner = (command, args) => {
      calls.push({ command, args });
      return {
        status: 0,
        stdout: JSON.stringify([
          { id: 42, node_id: 'IFD_node', name: 'Start date', data_type: 'date' },
        ]),
        stderr: '',
      };
    };
    const client = new GitHubFieldPinningClient({ runner });

    assert.deepEqual(client.listIssueFields('tanaabased'), {
      ok: true,
      value: [{ id: 42, nodeId: 'IFD_node', name: 'Start date' }],
    });
    assert.deepEqual(calls[0], {
      command: 'gh',
      args: ['api', '/orgs/tanaabased/issue-fields', '-H', 'X-GitHub-Api-Version: 2026-03-10'],
    });
  });

  it('should retain endpoint context for a failed field read', () => {
    const client = new GitHubFieldPinningClient({
      runner: () => ({ status: 1, stdout: '', stderr: 'HTTP 403' }),
    });

    assert.deepEqual(client.listIssueFields('tanaabased'), {
      ok: false,
      error: 'GET /orgs/tanaabased/issue-fields: HTTP 403',
    });
  });
});
