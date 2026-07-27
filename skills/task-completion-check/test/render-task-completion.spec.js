import assert from 'node:assert/strict';

import renderTaskCompletion from '../utils/render-task-completion.js';

describe('skills/task-completion-check/utils/render-task-completion', () => {
  it('should render task, acceptance, pull request, and failure evidence', () => {
    const output = renderTaskCompletion({
      criteria: [{ complete: true, text: 'tests pass' }],
      errors: [],
      pullRequests: [
        {
          blockers: ['1 failing checks'],
          failureDetails: [
            {
              detailsUrl: 'https://example.com/run',
              logSnippet: 'Error: failed',
              name: 'test',
            },
          ],
          number: '8',
          outcome: 'blocked',
          slug: 'tanaabased/canon',
          title: 'Implement task',
          waiting: [],
        },
      ],
      reason: 'Delivery is blocked.',
      status: 'blocked',
      target: { number: '7', slug: 'tanaabased/canon' },
      task: { comments: [{ body: 'context' }], title: 'Task title' },
    });

    assert.match(output, /task tanaabased\/canon#7: BLOCKED/);
    assert.match(output, /- \[x\] tests pass/);
    assert.match(output, /tanaabased\/canon#8: blocked/);
    assert.match(output, / {4}Error: failed/);
    assert.match(output, /task comments inspected: 1/);
  });
});
