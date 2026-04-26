import assert from 'node:assert/strict';

import booleanFromEnv from '../utils/boolean-from-env.js';

describe('utils/boolean-from-env', () => {
  it('should use the fallback when the key is absent', () => {
    assert.equal(booleanFromEnv({}, 'FORCE_COLOR'), false);
    assert.equal(booleanFromEnv({}, 'FORCE_COLOR', true), true);
  });

  it('should parse present environment values', () => {
    assert.equal(booleanFromEnv({ FORCE_COLOR: '1' }, 'FORCE_COLOR'), true);
    assert.equal(booleanFromEnv({ FORCE_COLOR: '0' }, 'FORCE_COLOR', true), false);
  });

  it('should keep empty environment values on the fallback path', () => {
    assert.equal(booleanFromEnv({ FORCE_COLOR: '' }, 'FORCE_COLOR', true), true);
  });
});
