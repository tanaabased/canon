import assert from 'node:assert/strict';

import resolveSkillOwner from '../utils/resolve-skill-owner.js';

describe('skills/skill-author/utils/resolve-skill-owner', () => {
  it('should default omitted ownership and accept supported explicit owners', () => {
    assert.equal(resolveSkillOwner(), 'tanaab');
    assert.equal(resolveSkillOwner('tanaab'), 'tanaab');
    assert.equal(resolveSkillOwner('pirog'), 'pirog');
  });

  it('should reject malformed and unsupported explicit ownership', () => {
    for (const value of [null, false, 0, [], {}, '', 'PIROG', ' pirog ', 'piro', 'other-owner']) {
      assert.throws(() => resolveSkillOwner(value), /Skill owner must be one of: tanaab, pirog/);
    }
  });
});
