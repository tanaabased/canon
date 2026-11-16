import assert from 'node:assert/strict';

import parseSkillFrontmatter, {
  splitLeadingSkillFrontmatter,
} from '../utils/parse-skill-frontmatter.js';

describe('skills/skill-author/utils/parse-skill-frontmatter', () => {
  it('should reject invalid YAML rather than accepting a second mapping colon', () => {
    assert.equal(
      parseSkillFrontmatter('---\ndescription: Compare fields: show changes.\n---\n'),
      null,
    );
    assert.throws(() =>
      splitLeadingSkillFrontmatter('---\ndescription: Compare fields: show changes.\n---\n'),
    );
  });

  it('should parse nested metadata, lists, and the remaining body', () => {
    const content = `---
name: tanaab-example
metadata:
  type: generic
  tags:
    - tanaab
    - generic
  openclaw:
    emoji: '🧩'
    homepage: https://example.com/skill
    requires:
      anyBins:
        - bun
        - node
---
# Example
`;

    assert.deepEqual(parseSkillFrontmatter(content), {
      metadata: {
        openclaw: {
          emoji: '🧩',
          homepage: 'https://example.com/skill',
          requires: { anyBins: ['bun', 'node'] },
        },
        tags: ['tanaab', 'generic'],
        type: 'generic',
      },
      name: 'tanaab-example',
    });
    assert.equal(splitLeadingSkillFrontmatter(content).body, '# Example\n');
  });
});
