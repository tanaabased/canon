import assert from 'node:assert/strict';

import { createGitHubChecksClient } from '../lib/github-checks-client.js';

describe('skills/github-checks-triage/lib/github-checks-client', () => {
  it('should negotiate legacy check fields through an injected command runner', () => {
    const calls = [];
    const runner = (command, args) => {
      calls.push([command, ...args]);
      if (args.some((value) => value.includes('conclusion,detailsUrl'))) {
        return {
          error: null,
          returncode: 1,
          stderr: 'Available fields:\nname\nstate\nbucket\nlink\n',
          stdout: '',
        };
      }
      return {
        error: null,
        returncode: 0,
        stderr: '',
        stdout: JSON.stringify([{ bucket: 'fail', link: 'https://example.com', name: 'test' }]),
      };
    };
    const client = createGitHubChecksClient({ runner });

    assert.deepEqual(client.fetchChecks('12', '/repo'), [
      { bucket: 'fail', link: 'https://example.com', name: 'test' },
    ]);
    assert.equal(calls.length, 2);
    assert.ok(calls.every(([command]) => command === 'gh'));
  });
});
