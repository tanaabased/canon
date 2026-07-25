import assert from 'node:assert/strict';

import isKebabCaseId from '../utils/is-kebab-case-id.js';

describe('skills/skill-author/utils/is-kebab-case-id', () => {
  it('should accept canonical ids and reject malformed ids', () => {
    assert.equal(isKebabCaseId('github-checks'), true);
    assert.equal(isKebabCaseId('GitHub--checks'), false);
  });
});
