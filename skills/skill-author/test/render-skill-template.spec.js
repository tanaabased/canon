import assert from 'node:assert/strict';

import renderSkillTemplate from '../utils/render-skill-template.js';

describe('skills/skill-author/utils/render-skill-template', () => {
  it('should replace known tokens and preserve unknown tokens', () => {
    assert.equal(
      renderSkillTemplate(
        '{{skill_id}} {{  skill_id\t}} {{_alias}} {{ unknown }} {{ constructor }}',
        {
          skill_id: 'tanaab-example',
          _alias: 'example',
        },
      ),
      'tanaab-example tanaab-example example {{ unknown }} {{ constructor }}',
    );
  });

  it('leaves dollar-prefixed GitHub Actions expressions for the workflow runner', () => {
    assert.equal(
      renderSkillTemplate('{{ owner }} ${{ owner }} ${{ matrix.os }}', { owner: 'tanaab' }),
      'tanaab ${{ owner }} ${{ matrix.os }}',
    );
  });
});
