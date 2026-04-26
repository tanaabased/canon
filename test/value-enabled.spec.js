import assert from 'node:assert/strict';

import valueEnabled from '../utils/value-enabled.js';

describe('utils/value-enabled', () => {
  it('should use the fallback for missing values', () => {
    assert.equal(valueEnabled(undefined), false);
    assert.equal(valueEnabled(null, true), true);
    assert.equal(valueEnabled('', true), true);
  });

  it('should parse known disabled values as false', () => {
    for (const value of ['0', 'false', 'no', 'off', 'disabled']) {
      assert.equal(valueEnabled(value, true), false);
    }
  });

  it('should parse known enabled values as true', () => {
    for (const value of ['1', 'true', 'yes', 'on', 'enabled']) {
      assert.equal(valueEnabled(value), true);
    }
  });

  it('should treat unknown present values as enabled', () => {
    assert.equal(valueEnabled('maybe'), true);
  });
});
