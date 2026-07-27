import assert from 'node:assert/strict';

import classifyTaskCompletion from '../utils/classify-task-completion.js';

const completeCriterion = [{ complete: true, text: 'done' }];

function classify(overrides = {}) {
  return classifyTaskCompletion({
    criteria: completeCriterion,
    errors: [],
    pullRequests: [],
    task: { state: 'OPEN' },
    ...overrides,
  });
}

describe('skills/task-completion-check/utils/classify-task-completion', () => {
  it('should classify closed issues as complete', () => {
    assert.equal(classify({ criteria: [], task: { state: 'CLOSED' } }).status, 'complete');
  });

  it('should require structured acceptance criteria', () => {
    assert.equal(classify({ criteria: [] }).status, 'uncertain');
  });

  it('should block incomplete criteria before delivery evidence', () => {
    assert.equal(
      classify({ criteria: [{ complete: false, text: 'remaining' }], errors: ['offline'] }).status,
      'blocked',
    );
  });

  it('should distinguish uncertain, blocked, pending, and ready evidence', () => {
    assert.equal(classify({ errors: ['API unavailable'] }).status, 'uncertain');
    assert.equal(classify({ pullRequests: [{ outcome: 'blocked' }] }).status, 'blocked');
    assert.equal(classify({ pullRequests: [{ outcome: 'pending' }] }).status, 'pending');
    assert.equal(classify({ pullRequests: [{ outcome: 'landed' }] }).status, 'ready');
    assert.equal(classify().status, 'ready');
    assert.equal(classify({ pullRequests: [{ outcome: 'discarded' }] }).status, 'blocked');
  });
});
