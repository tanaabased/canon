import assert from 'node:assert/strict';

import runGh from '../../skills/github-repository-author/scripts/utils/run-gh.js';

describe('skills/github-repository-author/scripts/utils/run-gh', () => {
  it('should invoke gh without shell interpolation and pass standard input', () => {
    const calls = [];
    const spawnSync = (command, args, options) => {
      calls.push({ args, command, options });
      return { status: 0, stderr: '', stdout: '{"login":"pirog"}' };
    };

    const result = runGh(['api', 'user'], { input: '{}\n' }, { spawnSync });

    assert.deepEqual(calls, [
      {
        args: ['api', 'user'],
        command: 'gh',
        options: {
          encoding: 'utf8',
          input: '{}\n',
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      },
    ]);
    assert.deepEqual(result, {
      error: null,
      status: 0,
      stderr: '',
      stdout: '{"login":"pirog"}',
    });
  });

  it('should normalize process launch failures', () => {
    const failure = new Error('gh not found');
    const spawnSync = () => ({ error: failure, status: null });

    assert.deepEqual(runGh(['--version'], {}, { spawnSync }), {
      error: failure,
      status: 1,
      stderr: '',
      stdout: '',
    });
  });
});
