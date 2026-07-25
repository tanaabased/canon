import assert from 'node:assert/strict';

import summarizeDiff from '../utils/summarize-diff.js';

describe('utils/summarize-diff', () => {
  it('should summarize populated drift groups in stable order', () => {
    assert.equal(
      summarizeDiff({ changed: ['a'], extra: ['b', 'c'], missing: [] }),
      'changed 1, extra 2',
    );
    assert.equal(summarizeDiff({ changed: [], extra: [], missing: [] }), 'in sync');
  });
});
