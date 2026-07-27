import assert from 'node:assert/strict';

import { createGitHubTaskClient } from '../lib/github-task-client.js';

function result(stdout = '', overrides = {}) {
  return { error: null, returncode: 0, stderr: '', stdout, ...overrides };
}

describe('skills/task-completion-check/lib/github-task-client', () => {
  it('should report unavailable and unauthenticated gh clients', () => {
    const missing = createGitHubTaskClient({
      runner: () => result('', { error: new Error('missing'), returncode: 1 }),
    });
    assert.deepEqual(missing.ensureAvailable(), {
      message: 'gh is not installed or not on PATH.',
      ok: false,
    });

    const unauthenticated = createGitHubTaskClient({
      runner: (_command, args) =>
        args[0] === '--version'
          ? result('gh version')
          : result('', { returncode: 1, stderr: 'no auth' }),
    });
    assert.deepEqual(unauthenticated.ensureAvailable(), { message: 'no auth', ok: false });
  });

  it('should inspect an explicit task through the issue API surface', () => {
    const calls = [];
    const client = createGitHubTaskClient({
      runner: (command, args) => {
        calls.push([command, ...args]);
        return result(JSON.stringify({ number: 7, state: 'OPEN', title: 'Task' }));
      },
    });

    assert.equal(client.fetchTask({ number: '7', slug: 'tanaabased/canon' }).title, 'Task');
    assert.deepEqual(calls[0].slice(0, 7), [
      'gh',
      'issue',
      'view',
      '7',
      '--repo',
      'tanaabased/canon',
      '--json',
    ]);
  });

  it('should discover open and closed pull request references with GraphQL', () => {
    let argsSeen;
    const client = createGitHubTaskClient({
      runner: (_command, args) => {
        argsSeen = args;
        return result(
          JSON.stringify({
            data: {
              repository: {
                issue: {
                  closedByPullRequestsReferences: {
                    nodes: [
                      {
                        number: 8,
                        repository: { nameWithOwner: 'tanaabased/canon' },
                        url: 'https://github.com/tanaabased/canon/pull/8',
                      },
                    ],
                  },
                },
              },
            },
          }),
        );
      },
    });

    assert.deepEqual(
      client.fetchLinkedPullRequests({
        number: '7',
        owner: 'tanaabased',
        repo: 'canon',
        slug: 'tanaabased/canon',
      }),
      [
        {
          number: '8',
          slug: 'tanaabased/canon',
          url: 'https://github.com/tanaabased/canon/pull/8',
        },
      ],
    );
    assert.match(argsSeen.join(' '), /closedByPullRequestsReferences/);
    assert.match(argsSeen.join(' '), /includeClosedPrs: true/);
  });

  it('should negotiate legacy check fields through the injected runner', () => {
    const calls = [];
    const client = createGitHubTaskClient({
      runner: (_command, args) => {
        calls.push(args);
        if (args.some((value) => value.includes('conclusion,detailsUrl'))) {
          return result('', {
            returncode: 1,
            stderr: 'Available fields:\nname\nstate\nbucket\nlink\n',
          });
        }
        return result(
          JSON.stringify([{ bucket: 'fail', link: 'https://example.com', name: 'test' }]),
        );
      },
    });

    assert.equal(client.fetchChecks({ number: '8', slug: 'tanaabased/canon' })[0].bucket, 'fail');
    assert.equal(calls.length, 2);
    assert.ok(calls.every((args) => args.includes('--repo')));
  });

  it('should accept valid failing-check JSON with a nonzero gh exit code', () => {
    const client = createGitHubTaskClient({
      runner: () => result(JSON.stringify([{ bucket: 'fail', name: 'test' }]), { returncode: 1 }),
    });

    assert.deepEqual(client.fetchChecks({ number: '8', slug: 'tanaabased/canon' }), [
      { bucket: 'fail', name: 'test' },
    ]);
  });

  it('should fall back from pending run logs to raw job logs', () => {
    const calls = [];
    const client = createGitHubTaskClient({
      runner: (_command, args, options) => {
        calls.push({ args, options });
        if (args.includes('--log')) {
          return result('', {
            returncode: 1,
            stderr: 'Log will be available when it is complete',
          });
        }
        return result(Buffer.from('job log'));
      },
    });

    assert.deepEqual(
      client.fetchCheckLog({ jobId: '456', runId: '123', slug: 'tanaabased/canon' }),
      { error: '', status: 'ok', text: 'job log' },
    );
    assert.deepEqual(calls.at(-1).options, { raw: true });
  });
});
