import assert from 'node:assert/strict';

import { GitHubFieldColorClient } from '../lib/github-field-color-client.js';

describe('skills/github-issue-schema-author/lib/github-field-color-client', () => {
  it('should read and normalize organization options in priority order', () => {
    const calls = [];
    const runner = (command, args) => {
      calls.push({ command, args });
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
    const client = new GitHubFieldColorClient({ runner });

    const result = client.listIssueFields('tanaabased');

    assert.equal(result.ok, true);
    assert.deepEqual(
      result.value[0].options.map(({ id }) => id),
      [1, 2],
    );
    assert.deepEqual(calls[0].args.slice(0, 2), ['api', '/orgs/tanaabased/issue-fields']);
  });

  it('should PATCH only the complete retained option array', () => {
    const calls = [];
    const runner = (command, args, options = {}) => {
      calls.push({ command, args, input: options.input });
      return { status: 0, stdout: JSON.stringify({ id: 50 }), stderr: '' };
    };
    const client = new GitHubFieldColorClient({ runner });
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
    const client = new GitHubFieldColorClient({
      runner: () => ({ status: 1, stdout: '', stderr: 'gh: Forbidden (HTTP 403)' }),
    });
    const result = client.recolorIssueField('tanaabased', 50, []);

    assert.equal(result.ok, false);
    assert.match(result.error, /PATCH \/orgs\/tanaabased\/issue-fields\/50.*Forbidden/);
  });
});
