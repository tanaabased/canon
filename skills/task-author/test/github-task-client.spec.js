import assert from 'node:assert/strict';

import { GitHubTaskClient } from '../lib/github-task-client.js';

function success(value) {
  return { status: 0, stdout: JSON.stringify(value), stderr: '', error: null };
}

describe('Task Author GitHub task client', () => {
  it('should send JSON through stdin for create and comment writes', () => {
    const calls = [];
    const runner = (args, options = {}) => {
      calls.push({ args, input: options.input ?? null });
      if (args[1] === '/repos/acme/widgets/issues') {
        return success({ number: 41, html_url: 'https://github.com/acme/widgets/issues/41' });
      }
      return success({ id: 7, body: 'audit' });
    };
    const client = new GitHubTaskClient({ runner });
    const target = { slug: 'acme/widgets' };

    assert.equal(
      client.createIssue(target, { title: 'test', body: 'body', type: 'Task' }).ok,
      true,
    );
    assert.equal(client.addComment(target, 41, 'audit').ok, true);

    assert.deepEqual(JSON.parse(calls[0].input), { title: 'test', body: 'body', type: 'Task' });
    assert.deepEqual(JSON.parse(calls[1].input), { body: 'audit' });
    assert.ok(calls.every(({ args }) => args.includes('X-GitHub-Api-Version: 2026-03-10')));
    assert.ok(calls.every(({ args }) => args.includes('--method') && args.includes('POST')));
  });

  it('should expose failed writes without throwing away the endpoint context', () => {
    const client = new GitHubTaskClient({
      runner: () => ({ status: 1, stdout: '', stderr: 'gh: Forbidden (HTTP 403)' }),
    });
    const result = client.createIssue({ slug: 'acme/widgets' }, { title: 'test' });

    assert.equal(result.ok, false);
    assert.match(result.error, /POST \/repos\/acme\/widgets\/issues.*Forbidden/);
  });
});
