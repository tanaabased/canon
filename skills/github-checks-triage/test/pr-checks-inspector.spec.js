import assert from 'node:assert/strict';

import { inspectPrChecks } from '../lib/pr-checks-inspector.js';

describe('skills/github-checks-triage/lib/pr-checks-inspector', () => {
  it('should inspect failing checks through a fake client without live GitHub calls', () => {
    const client = {
      ensureAvailable: () => ({ ok: true }),
      fetchCheckLog: () => ({ error: '', status: 'ok', text: 'setup\nError: broken\ntail' }),
      fetchChecks: () => [
        {
          conclusion: 'failure',
          detailsUrl: 'https://github.com/acme/repo/actions/runs/123/job/456',
          name: 'unit tests',
        },
        { conclusion: 'success', name: 'lint' },
      ],
      fetchRunMetadata: () => ({ conclusion: 'failure', workflowName: 'CI' }),
      findGitRoot: () => '/repo',
      resolvePr: () => '12',
    };

    const result = inspectPrChecks({ context: 1, maxLines: 20, pr: '12', repo: '/repo' }, client);

    assert.equal(result.pr, '12');
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].runId, '123');
    assert.match(result.results[0].logSnippet, /Error: broken/);
  });

  it('should stop before GitHub access outside a repository', () => {
    assert.throws(
      () =>
        inspectPrChecks(
          { context: 1, maxLines: 20, repo: '/missing' },
          { findGitRoot: () => null },
        ),
      /not inside a Git repository/,
    );
  });
});
