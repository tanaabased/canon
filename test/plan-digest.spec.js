import assert from 'node:assert/strict';

import planDigest from '../utils/plan-digest.js';

describe('utils/plan-digest', () => {
  it('should bind authorization to the exact serialized plan', () => {
    assert.equal(
      planDigest({ a: 1 }),
      'sha256:015abd7f5cc57a2dd94b7590f04ad8084273905ee33ec5cebeae62276a97f862',
    );
    assert.notEqual(planDigest({ a: 1 }), planDigest({ a: 2 }));
  });
});
