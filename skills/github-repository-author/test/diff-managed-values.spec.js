import assert from 'node:assert/strict';

import diffManagedValues from '../utils/diff-managed-values.js';

describe('skills/github-repository-author/utils/diff-managed-values', () => {
  it('should report only desired managed paths', () => {
    const changes = diffManagedValues({ managed: ['ci'], unmanaged: 'keep' }, { managed: [] });

    assert.deepEqual(changes, [{ current: ['ci'], desired: [], path: 'managed' }]);
  });

  it('should sort nested paths and represent missing values as null', () => {
    const changes = diffManagedValues({}, { zed: true, alpha: { beta: false } });

    assert.deepEqual(changes, [
      { current: null, desired: false, path: 'alpha.beta' },
      { current: null, desired: true, path: 'zed' },
    ]);
  });
});
