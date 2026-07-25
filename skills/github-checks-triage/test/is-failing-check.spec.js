import assert from 'node:assert/strict';

import isFailingCheck from '../utils/is-failing-check.js';

describe('skills/github-checks-triage/utils/is-failing-check', () => {
  it('should classify modern and legacy failure fields', () => {
    assert.equal(isFailingCheck({ conclusion: 'failure' }), true);
    assert.equal(isFailingCheck({ bucket: 'fail' }), true);
    assert.equal(isFailingCheck({ state: 'success' }), false);
  });
});
