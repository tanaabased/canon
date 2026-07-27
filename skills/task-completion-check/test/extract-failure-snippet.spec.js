import assert from 'node:assert/strict';

import extractFailureSnippet from '../utils/extract-failure-snippet.js';

describe('skills/task-completion-check/utils/extract-failure-snippet', () => {
  it('should prefer context around the final failure marker', () => {
    const log = ['start', 'Error: first', 'middle', 'FAIL final', 'tail'].join('\n');

    assert.equal(extractFailureSnippet(log, { context: 1, maxLines: 3 }), 'middle\nFAIL final');
  });

  it('should return a bounded tail when no marker exists', () => {
    assert.equal(extractFailureSnippet('a\nb\nc', { context: 1, maxLines: 2 }), 'b\nc');
  });
});
