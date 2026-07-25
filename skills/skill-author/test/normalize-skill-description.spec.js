import assert from 'node:assert/strict';

import normalizeSkillDescription, {
  makeShortSkillDescription,
  makeSkillDefaultPrompt,
} from '../utils/normalize-skill-description.js';

describe('skills/skill-author/utils/normalize-skill-description', () => {
  it('should normalize owner prose and derive metadata text', () => {
    const description = normalizeSkillDescription('tanaab based creating useful skills.');

    assert.equal(description, 'Tanaab-based creating useful skills.');
    assert.equal(makeShortSkillDescription(description), 'Tanaab-based creating useful skills');
    assert.equal(
      makeSkillDefaultPrompt('tanaab-example', description),
      'Use $tanaab-example when you need to creating useful skills.',
    );
  });
});
