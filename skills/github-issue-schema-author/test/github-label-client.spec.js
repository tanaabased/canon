import assert from 'node:assert/strict';

import { GitHubLabelClient } from '../lib/github-label-client.js';

describe('skills/github-issue-schema-author/lib/github-label-client', () => {
  it('should create and definition-update labels through stdin', () => {
    const calls = [];
    const client = new GitHubLabelClient({
      runner: (command, args, options = {}) => {
        calls.push({ command, args, input: options.input });
        return { status: 0, stdout: JSON.stringify({ id: 1 }), stderr: '' };
      },
    });
    const target = { slug: 'acme/widgets' };

    assert.equal(
      client.createLabel(target, {
        name: 'blocked',
        color: '7f1d1d',
        description: 'Blocked.',
      }).ok,
      true,
    );
    assert.equal(
      client.updateLabel(target, 'help wanted', {
        color: '00c88a',
        description: 'Help.',
      }).ok,
      true,
    );

    assert.deepEqual(calls[0].args.slice(0, 4), [
      'api',
      '/repos/acme/widgets/labels',
      '--method',
      'POST',
    ]);
    assert.deepEqual(calls[1].args.slice(0, 4), [
      'api',
      '/repos/acme/widgets/labels/help%20wanted',
      '--method',
      'PATCH',
    ]);
    assert.deepEqual(JSON.parse(calls[1].input), {
      color: '00c88a',
      description: 'Help.',
    });
  });
});
