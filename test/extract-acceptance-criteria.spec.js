import assert from 'node:assert/strict';

import extractAcceptanceCriteria from '../utils/extract-acceptance-criteria.js';

describe('skills/task-completion-check/utils/extract-acceptance-criteria', () => {
  it('should extract ordered Markdown task-list criteria', () => {
    const body = [
      '## Acceptance',
      '- [x] tests pass',
      '  - [ ] docs match behavior',
      '1. [X] release is drafted',
      '[ ] not a list item',
    ].join('\n');

    assert.deepEqual(extractAcceptanceCriteria(body), [
      { complete: true, text: 'tests pass' },
      { complete: false, text: 'docs match behavior' },
      { complete: true, text: 'release is drafted' },
    ]);
  });

  it('should return an empty list when no structured criteria exist', () => {
    assert.deepEqual(extractAcceptanceCriteria('Ship when it looks good.'), []);
  });
});
