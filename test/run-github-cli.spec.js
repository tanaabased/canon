import assert from 'node:assert/strict';

import runGitHubCli, {
  flattenGitHubPages,
  GITHUB_API_VERSION_HEADER,
  githubCliResultDetail,
  githubCliResultStatus,
} from '../lib/run-github-cli.js';

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

  it('should expose the shared GitHub response contract', () => {
    assert.equal(GITHUB_API_VERSION_HEADER, 'X-GitHub-Api-Version: 2026-03-10');
    assert.equal(githubCliResultStatus({ returncode: 7, status: 0 }), 7);
    assert.equal(githubCliResultStatus({ status: 0 }), 0);
    assert.equal(githubCliResultDetail({ stderr: ' denied\n', stdout: 'ignored' }), 'denied');
    assert.deepEqual(flattenGitHubPages([[{ id: 1 }], [{ id: 2 }]]), [{ id: 1 }, { id: 2 }]);
    assert.deepEqual(flattenGitHubPages([{ id: 1 }]), [{ id: 1 }]);
  });
});
