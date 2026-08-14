import assert from 'node:assert/strict';

import runGitHubCli from '../lib/run-github-cli.js';

describe('lib/run-github-cli', () => {
  it('should preserve the bare gh command contract for host-managed routing', () => {
    const calls = [];
    const expected = { status: 19, stdout: 'out', stderr: 'denied' };
    const args = ['api', '/repos/acme/widgets', '--input', '-'];
    const result = runGitHubCli(
      args,
      { input: '{"title":"test"}' },
      {
        spawnSync: (...call) => {
          calls.push(call);
          return expected;
        },
      },
    );

    assert.equal(result, expected);
    assert.deepEqual(calls, [['gh', args, { encoding: 'utf8', input: '{"title":"test"}' }]]);
  });

  it('should reject process options that can bypass host routing', () => {
    assert.throws(
      () => runGitHubCli(['auth', 'status'], { cwd: '/tmp' }),
      /must inherit the active process cwd/,
    );
    assert.throws(
      () => runGitHubCli(['auth', 'status'], { env: {} }),
      /must inherit the active process env/,
    );
  });
});
