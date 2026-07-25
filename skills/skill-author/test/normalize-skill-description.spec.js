import assert from 'node:assert/strict';

import normalizeSkillDescription, {
  makeShortSkillDescription,
  makeSkillDefaultPrompt,
} from '../utils/normalize-skill-description.js';

describe('skills/skill-author/utils/normalize-skill-description', () => {
  it('should normalize owner prose', () => {
    assert.equal(
      normalizeSkillDescription('tanaab based creating useful skills.'),
      'Tanaab-based creating useful skills.',
    );
  });

  it('should derive short metadata text', () => {
    assert.equal(
      makeShortSkillDescription('Tanaab-based creating useful skills.'),
      'Tanaab-based creating useful skills',
    );
  });

  it('should create a grammar-safe default prompt', () => {
    assert.equal(
      makeSkillDefaultPrompt('tanaab-example', 'Tanaab-based creating useful skills.'),
      'Use $tanaab-example for creating useful skills.',
    );
  });
});
