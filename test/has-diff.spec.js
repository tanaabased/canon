import assert from 'node:assert/strict';

import hasDiff from '../utils/has-diff.js';

describe('utils/has-diff', () => {
  it('should distinguish aligned and drifted entry groups', () => {
    assert.equal(hasDiff({ changed: [], extra: [], missing: [] }), false);
    assert.equal(hasDiff({ changed: [], extra: ['extra'], missing: [] }), true);
  });
});
