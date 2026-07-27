import assert from 'node:assert/strict';

import hasOrderedSkillSections from '../utils/has-ordered-skill-sections.js';

describe('skills/skill-author/utils/has-ordered-skill-sections', () => {
  it('should allow declared optional sections to be omitted but reject reordered sections', () => {
    const orderedHeadings = [
      '# ',
      '## Overview',
      '## Optional',
      '## Optimization',
      '## Validation',
    ];
    const optionalHeadings = ['## Optional', '## Optimization'];

    assert.equal(
      hasOrderedSkillSections(
        '# Example\n## Overview\n## Validation',
        orderedHeadings,
        optionalHeadings,
      ),
      true,
    );
    assert.equal(
      hasOrderedSkillSections(
        '# Example\n## Overview\n## Optimization\n## Validation',
        orderedHeadings,
        optionalHeadings,
      ),
      true,
    );
    assert.equal(
      hasOrderedSkillSections(
        '# Example\n## Optimization\n## Overview\n## Validation',
        orderedHeadings,
        optionalHeadings,
      ),
      false,
    );
  });
});
