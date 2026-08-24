import assert from 'node:assert/strict';

import { GitHubTaskDecomposerClient } from '../lib/github-task-decomposer-client.js';

const target = { slug: 'acme/widgets' };

describe('GitHub Task Decomposer client', () => {
  it('should use current native relationship endpoints and structured standard input', () => {
    const calls = [];
    const runner = (args, options = {}) => {
      calls.push({ args, options });
      return { status: 0, stdout: JSON.stringify({ id: 10, number: 2 }) };
    };
    const client = new GitHubTaskDecomposerClient({ runner });

    client.createIssue(target, { title: 'Sensitive task title', body: 'Sensitive body' });
    client.addSubIssue(target, 1, 10);
    client.addBlockedBy(target, 2, 11);

    assert.deepEqual(
      calls.map(({ args }) => args[1]),
      [
        '/repos/acme/widgets/issues',
        '/repos/acme/widgets/issues/1/sub_issues',
        '/repos/acme/widgets/issues/2/dependencies/blocked_by',
      ],
    );
    for (const { args, options } of calls) {
      assert.ok(args.includes('--input'));
      assert.ok(args.includes('-'));
      assert.ok(options.input);
      assert.doesNotMatch(args.join(' '), /Sensitive task title|Sensitive body/);
    }
    assert.deepEqual(JSON.parse(calls[1].options.input), { sub_issue_id: 10 });
    assert.deepEqual(JSON.parse(calls[2].options.input), { issue_id: 11 });
  });

  it('should paginate read-only hierarchy and dependency evidence', () => {
    const calls = [];
    const runner = (args) => {
      calls.push(args);
      return { status: 0, stdout: JSON.stringify([[{ id: 10, number: 2 }]]) };
    };
    const client = new GitHubTaskDecomposerClient({ runner });

    assert.equal(client.listSubIssues(target, 1).value.length, 1);
    assert.equal(client.listBlockedBy(target, 1).value.length, 1);
    assert.equal(client.listBlocking(target, 1).value.length, 1);

    assert.deepEqual(
      calls.map((args) => args[1]),
      [
        '/repos/acme/widgets/issues/1/sub_issues?per_page=100',
        '/repos/acme/widgets/issues/1/dependencies/blocked_by?per_page=100',
        '/repos/acme/widgets/issues/1/dependencies/blocking?per_page=100',
      ],
    );
    assert.ok(calls.every((args) => args.includes('--paginate') && args.includes('--slurp')));
    assert.ok(calls.every((args) => args.includes('X-GitHub-Api-Version: 2026-03-10')));
  });

  it('should bound repository candidates and search exact child titles separately', () => {
    const calls = [];
    const runner = (args) => {
      calls.push(args);
      const value = args[1].startsWith('/search/issues')
        ? { items: [{ id: 10, number: 2, title: 'Quoted "task"' }] }
        : [{ id: 11, number: 3 }];
      return { status: 0, stdout: JSON.stringify(value) };
    };
    const client = new GitHubTaskDecomposerClient({ runner });

    assert.equal(client.listRepositoryIssues(target).value.length, 1);
    assert.equal(client.searchIssuesByTitle(target, 'Quoted "task"').value.length, 1);

    assert.equal(
      calls[0][1],
      '/repos/acme/widgets/issues?state=all&sort=updated&direction=desc&per_page=100',
    );
    assert.ok(calls[1][1].startsWith('/search/issues?q='));
    assert.match(decodeURIComponent(calls[1][1]), /repo:acme\/widgets is:issue in:title/);
    assert.ok(calls.every((args) => !args.includes('--paginate')));
  });

  it('should inspect repository capabilities once per target', () => {
    const calls = [];
    const runner = (args) => {
      calls.push(args);
      const endpoint = args[1];
      if (endpoint === '/repos/acme/widgets') {
        return {
          status: 0,
          stdout: JSON.stringify({
            owner: { login: 'acme', type: 'User' },
            private: false,
          }),
        };
      }
      return { status: 0, stdout: JSON.stringify([[]]) };
    };
    const client = new GitHubTaskDecomposerClient({ runner });

    client.inspectRepository(target);
    client.inspectRepository(target);

    assert.equal(calls.filter((args) => args[1] === '/repos/acme/widgets').length, 1);
    assert.equal(calls.filter((args) => args[1]?.includes('/labels?')).length, 1);
  });

  it('should retain a runner error when stderr is present but empty', () => {
    const client = new GitHubTaskDecomposerClient({
      runner: () => ({
        status: null,
        stdout: '',
        stderr: '',
        error: new Error('spawnSync gh ENOBUFS'),
      }),
    });

    const result = client.listRepositoryIssues(target);

    assert.equal(result.ok, false);
    assert.match(result.error, /spawnSync gh ENOBUFS/);
  });
});
