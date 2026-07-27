import assert from 'node:assert/strict';

import normalizeTaskTarget from '../utils/normalize-task-target.js';

describe('skills/task-completion-check/utils/normalize-task-target', () => {
  it('should normalize slug and GitHub issue URL targets', () => {
    const expected = {
      number: '12',
      owner: 'tanaabased',
      repo: 'canon',
      slug: 'tanaabased/canon',
      url: 'https://github.com/tanaabased/canon/issues/12',
    };

    assert.deepEqual(normalizeTaskTarget('tanaabased/canon#12'), expected);
    assert.deepEqual(
      normalizeTaskTarget('https://github.com/tanaabased/canon/issues/12'),
      expected,
    );
  });

  it('should reject ambiguous and non-issue targets', () => {
    assert.throws(() => normalizeTaskTarget('12'), /GitHub issue URL/);
    assert.throws(
      () => normalizeTaskTarget('https://github.com/tanaabased/canon/pull/12'),
      /GitHub issue URL/,
    );
  });
});
