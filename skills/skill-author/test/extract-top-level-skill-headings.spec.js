import assert from 'node:assert/strict';

import extractTopLevelSkillHeadings from '../utils/extract-top-level-skill-headings.js';

describe('skills/skill-author/utils/extract-top-level-skill-headings', () => {
  it('should normalize the title and ignore headings inside fenced examples', () => {
    const content = `# Example
## Overview
\`\`\`markdown
## Ignored
\`\`\`
### Detail
## Validation`;

    assert.deepEqual(extractTopLevelSkillHeadings(content), ['# ', '## Overview', '## Validation']);
  });
});
