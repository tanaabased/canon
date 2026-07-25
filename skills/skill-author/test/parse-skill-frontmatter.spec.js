import assert from 'node:assert/strict';

import parseSkillFrontmatter, {
  splitLeadingSkillFrontmatter,
} from '../utils/parse-skill-frontmatter.js';

describe('skills/skill-author/utils/parse-skill-frontmatter', () => {
  it('should parse nested metadata, lists, and the remaining body', () => {
    const content = `---
name: tanaab-example
metadata:
  type: generic
  tags:
    - tanaab
    - generic
---
# Example
`;

    assert.deepEqual(parseSkillFrontmatter(content), {
      metadata: { tags: ['tanaab', 'generic'], type: 'generic' },
      name: 'tanaab-example',
    });
    assert.equal(splitLeadingSkillFrontmatter(content).body, '# Example\n');
  });
});
