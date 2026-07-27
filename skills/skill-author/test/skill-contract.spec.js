import assert from 'node:assert/strict';

import { SKILL_TYPE_IDS, getSkillType } from '../lib/skill-contract.js';

describe('skills/skill-author/lib/skill-contract', () => {
  it('should expose Optimization as an optional facet in every full type template', () => {
    for (const type of SKILL_TYPE_IDS) {
      const definition = getSkillType(type);
      const optimizationIndex = definition.sectionOrder.indexOf('## Optimization');
      const resourcesIndex = definition.sectionOrder.indexOf('## Bundled Resources');

      assert.ok(definition.optionalTopLevelHeadings.includes('## Optimization'), type);
      assert.ok(optimizationIndex >= 0, type);
      assert.equal(optimizationIndex + 1, resourcesIndex, type);
    }
  });
});
