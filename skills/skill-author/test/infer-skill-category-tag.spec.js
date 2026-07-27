import assert from 'node:assert/strict';

import inferSkillCategoryTag from '../utils/infer-skill-category-tag.js';

describe('skills/skill-author/utils/infer-skill-category-tag', () => {
  it('should infer a category while excluding the declared type', () => {
    assert.equal(
      inferSkillCategoryTag({ description: 'Validate skills', type: 'meta' }),
      'validation',
    );
    assert.equal(inferSkillCategoryTag({ description: 'Generic prose', type: 'generic' }), null);
  });
});
