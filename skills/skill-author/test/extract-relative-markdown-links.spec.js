import assert from 'node:assert/strict';

import extractRelativeMarkdownLinks from '../utils/extract-relative-markdown-links.js';

describe('skills/skill-author/utils/extract-relative-markdown-links', () => {
  it('should retain relative targets and skip anchors and external schemes', () => {
    const markdown = [
      '[reference](./references/contract.md#shape)',
      '[anchor](#validation)',
      '[web](https://example.com)',
      '[mail](mailto:team@example.com)',
      '[image](data:image/png;base64,abc)',
    ].join('\n');

    assert.deepEqual(extractRelativeMarkdownLinks(markdown), ['./references/contract.md#shape']);
  });
});
