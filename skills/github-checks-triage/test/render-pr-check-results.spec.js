import assert from 'node:assert/strict';

import renderPrCheckResults from '../utils/render-pr-check-results.js';

describe('skills/github-checks-triage/utils/render-pr-check-results', () => {
  it('should render check identity, run metadata, and snippets', () => {
    const output = renderPrCheckResults('12', [
      {
        detailsUrl: 'https://example.com/run',
        logSnippet: 'Error: failed',
        name: 'test',
        run: { conclusion: 'failure', workflowName: 'CI' },
        runId: '123',
        status: 'ok',
      },
    ]);

    assert.match(output, /PR #12: 1 failing checks analyzed/);
    assert.match(output, /Workflow: CI \(failure\)/);
    assert.match(output, / {2}Error: failed/);
  });
});
