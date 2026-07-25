import assert from 'node:assert/strict';

import { createGitHubChecksClient } from '../lib/github-checks-client.js';

describe('skills/github-checks-triage/lib/github-checks-client', () => {
  it('should report an unavailable gh executable', () => {
    const client = createGitHubChecksClient({
      runner: () => ({ error: new Error('missing'), returncode: 1, stderr: '', stdout: '' }),
    });

    assert.deepEqual(client.ensureAvailable('/repo'), {
      message: 'gh is not installed or not on PATH.',
      ok: false,
    });
  });

  it('should report gh authentication failures', () => {
    const runner = (_command, args) =>
      args[0] === '--version'
        ? { error: null, returncode: 0, stderr: '', stdout: 'gh version' }
        : { error: null, returncode: 1, stderr: 'not logged in', stdout: '' };
    const client = createGitHubChecksClient({ runner });

    assert.deepEqual(client.ensureAvailable('/repo'), {
      message: 'not logged in',
      ok: false,
    });
  });

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

  it('should reject invalid check JSON', () => {
    const client = createGitHubChecksClient({
      runner: () => ({ error: null, returncode: 0, stderr: '', stdout: '{invalid' }),
    });

    assert.throws(() => client.fetchChecks('12', '/repo'), /unable to parse checks JSON/);
  });

  it('should fall back from pending run logs to raw job logs', () => {
    const calls = [];
    const runner = (_command, args, _cwd, options) => {
      calls.push({ args, options });
      if (args.includes('--log')) {
        return {
          error: null,
          returncode: 1,
          stderr: 'Log will be available when it is complete',
          stdout: '',
        };
      }
      if (args[0] === 'repo') {
        return {
          error: null,
          returncode: 0,
          stderr: '',
          stdout: JSON.stringify({ nameWithOwner: 'acme/repo' }),
        };
      }
      return {
        error: null,
        returncode: 0,
        stderr: '',
        stdout: Buffer.from('job log'),
      };
    };
    const client = createGitHubChecksClient({ runner });

    assert.deepEqual(client.fetchCheckLog({ jobId: '456', repoRoot: '/repo', runId: '123' }), {
      error: '',
      status: 'ok',
      text: 'job log',
    });
    assert.deepEqual(calls.at(-1).options, { raw: true });
  });

  it('should reject zipped job-log payloads', () => {
    const runner = (_command, args) => {
      if (args.includes('--log')) {
        return {
          error: null,
          returncode: 1,
          stderr: 'still in progress',
          stdout: '',
        };
      }
      if (args[0] === 'repo') {
        return {
          error: null,
          returncode: 0,
          stderr: '',
          stdout: JSON.stringify({ nameWithOwner: 'acme/repo' }),
        };
      }
      return {
        error: null,
        returncode: 0,
        stderr: '',
        stdout: Buffer.from('PK archive'),
      };
    };
    const client = createGitHubChecksClient({ runner });

    assert.deepEqual(client.fetchCheckLog({ jobId: '456', repoRoot: '/repo', runId: '123' }), {
      error: 'Job logs returned a zip archive; unable to parse.',
      status: 'error',
      text: '',
    });
  });
});
