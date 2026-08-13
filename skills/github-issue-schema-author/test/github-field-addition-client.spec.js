import assert from 'node:assert/strict';

import { GitHubFieldAdditionClient } from '../lib/github-field-addition-client.js';

describe('skills/github-issue-schema-author/lib/github-field-addition-client', () => {
  it('should use only the additive organization-field POST endpoint with JSON on stdin', () => {
    const calls = [];
    const runner = (command, args, options = {}) => {
      calls.push({ command, args, input: options.input ?? null });
      return { status: 0, stdout: JSON.stringify({ id: 512, name: 'Impact' }), stderr: '' };
    };
    const client = new GitHubFieldAdditionClient({ runner });
    const payload = {
      name: 'Impact',
      description: 'Expected local value.',
      data_type: 'single_select',
      visibility: 'all',
      options: [{ name: 'Low', description: '', color: 'gray', priority: 1 }],
    };

    const result = client.createIssueField('tanaabased', payload);

    assert.equal(result.ok, true);
    assert.equal(calls[0].command, 'gh');
    assert.deepEqual(calls[0].args.slice(0, 4), [
      'api',
      '/orgs/tanaabased/issue-fields',
      '--method',
      'POST',
    ]);
    assert.deepEqual(JSON.parse(calls[0].input), payload);
    assert.equal(calls[0].args.includes('PATCH'), false);
    assert.equal(calls[0].args.includes('DELETE'), false);
  });

  it('should retain endpoint context for a failed field creation', () => {
    const client = new GitHubFieldAdditionClient({
      runner: () => ({ status: 1, stdout: '', stderr: 'gh: Forbidden (HTTP 403)' }),
    });
    const result = client.createIssueField('tanaabased', { name: 'Impact' });

    assert.equal(result.ok, false);
    assert.match(result.error, /POST \/orgs\/tanaabased\/issue-fields.*Forbidden/);
  });
});
