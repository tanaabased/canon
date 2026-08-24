import assert from 'node:assert/strict';

import { GitHubMilestoneClient } from '../lib/github-milestone-client.js';

function success(value) {
  return { error: null, status: 0, stderr: '', stdout: JSON.stringify(value) };
}

describe('project-milestone-author/lib/github-milestone-client', () => {
  it('should paginate milestone reads and send every structured write through stdin', () => {
    const calls = [];
    const client = new GitHubMilestoneClient({
      runner: (args, options = {}) => {
        calls.push({ args, input: options.input ?? null });
        if (args.includes('--paginate')) {
          return success([[{ number: 1, title: 'One' }], [{ number: 2, title: 'Two' }]]);
        }
        return success({ number: 4 });
      },
    });

    assert.deepEqual(
      client.listMilestones('acme/widgets').value.map(({ number }) => number),
      [1, 2],
    );
    assert.equal(client.createMilestone('acme/widgets', { title: 'New' }).ok, true);
    assert.equal(client.updateTaskMilestone('acme/widgets', 9, 4).ok, true);

    const writes = calls.filter(({ input }) => input !== null);
    assert.deepEqual(JSON.parse(writes[0].input), { title: 'New' });
    assert.deepEqual(JSON.parse(writes[1].input), { milestone: 4 });
    assert.ok(writes.every(({ args }) => args.includes('--input') && args.includes('-')));
    assert.ok(calls.every(({ args }) => args.includes('X-GitHub-Api-Version: 2026-03-10')));
  });

  it('should retain method and endpoint context on provider failure', () => {
    const client = new GitHubMilestoneClient({
      runner: () => ({ status: 1, stderr: 'gh: Forbidden (HTTP 403)', stdout: '' }),
    });
    const result = client.updateMilestone('acme/widgets', 4, { state: 'closed' });

    assert.equal(result.ok, false);
    assert.match(result.error, /PATCH \/repos\/acme\/widgets\/milestones\/4.*Forbidden/);
  });
});
