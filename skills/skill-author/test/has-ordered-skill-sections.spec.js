import assert from 'node:assert/strict';

import hasOrderedSkillSections from '../utils/has-ordered-skill-sections.js';

describe('skills/skill-author/utils/has-ordered-skill-sections', () => {
  it('should allow declared optional sections to be omitted but reject reordered sections', () => {
    const orderedHeadings = [
      '# ',
      '## Overview',
      '## Optional',
      '## Review Criteria',
      '## Validation',
    ];
    const optionalHeadings = ['## Optional', '## Review Criteria'];

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
        '# Example\n## Overview\n## Review Criteria\n## Validation',
        orderedHeadings,
        optionalHeadings,
      ),
      true,
    );
    assert.equal(
      hasOrderedSkillSections(
        '# Example\n## Review Criteria\n## Overview\n## Validation',
        orderedHeadings,
        optionalHeadings,
      ),
      false,
    );
  });
});
