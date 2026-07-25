import assert from 'node:assert/strict';

import previewPaths from '../utils/preview-paths.js';

describe('utils/preview-paths', () => {
  it('should bound path output and report the remaining count', () => {
    assert.deepEqual(previewPaths(['a', 'b', 'c'], 2), ['a', 'b', '... 1 more']);
    assert.deepEqual(previewPaths([], 2), []);
  });
});
