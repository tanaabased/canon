import assert from 'node:assert/strict';

import { createGitHubMilestonePlannerClient } from '../lib/github-milestone-planner-client.js';

function result(stdout = '', overrides = {}) {
  return { error: null, returncode: 0, stderr: '', stdout, ...overrides };
}

const target = {
  number: '3',
  owner: 'tanaabased',
  repo: 'canon',
  slug: 'tanaabased/canon',
};

describe('skills/project-milestone-planner/lib/github-milestone-planner-client', () => {
  it('should report missing gh and allow unauthenticated public reads', () => {
    const missing = createGitHubMilestonePlannerClient({
      runner: () => result('', { error: new Error('missing'), returncode: 1 }),
    });
    assert.deepEqual(missing.ensureAvailable(), {
      message: 'gh is not installed or not on PATH.',
      ok: false,
    });

    const publicClient = createGitHubMilestonePlannerClient({
      runner: (_command, args) =>
        args[0] === '--version'
          ? result('gh version')
          : result('', { returncode: 1, stderr: 'not authenticated' }),
    });
    assert.deepEqual(publicClient.ensureAvailable(), {
      authenticated: false,
      message: 'not authenticated',
      ok: true,
    });
  });

  it('should inspect repository and milestone through read-only commands', () => {
    const calls = [];
    const client = createGitHubMilestonePlannerClient({
      runner: (command, args) => {
        calls.push([command, ...args]);
        if (args[0] === 'repo') {
          return result(JSON.stringify({ nameWithOwner: 'tanaabased/canon' }));
        }
        return result(JSON.stringify({ number: 3, title: 'Planner' }));
      },
    });

    assert.equal(client.fetchRepository(target).nameWithOwner, 'tanaabased/canon');
    assert.equal(client.fetchMilestone(target).number, 3);
    assert.deepEqual(calls[0].slice(0, 4), ['gh', 'repo', 'view', 'tanaabased/canon']);
    assert.deepEqual(calls[1].slice(0, 5), [
      'gh',
      'api',
      '--method',
      'GET',
      'repos/tanaabased/canon/milestones/3',
    ]);
  });

  it('should flatten paginated repository issue and pull-request evidence', () => {
    let argsSeen;
    const client = createGitHubMilestonePlannerClient({
      runner: (_command, args) => {
        argsSeen = args;
        return result(JSON.stringify([[{ number: 1 }], [{ number: 2, pull_request: {} }]]));
      },
    });

    assert.deepEqual(
      client.fetchIssueLikeItems(target).map((item) => item.number),
      [1, 2],
    );
    assert.ok(argsSeen.includes('--paginate'));
    assert.ok(argsSeen.includes('--slurp'));
    assert.equal(argsSeen[argsSeen.indexOf('--method') + 1], 'GET');
  });

  it('should preserve GitHub read failures as caller-facing errors', () => {
    const client = createGitHubMilestonePlannerClient({
      runner: () => result('', { returncode: 1, stderr: 'milestone missing' }),
    });

    assert.throws(() => client.fetchMilestone(target), /milestone missing/);
    assert.throws(() => client.fetchIssueLikeItems(target), /milestone missing/);
  });
});
