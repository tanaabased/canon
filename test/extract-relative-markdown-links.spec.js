import assert from 'node:assert/strict';

import extractRelativeMarkdownLinks from '../utils/extract-relative-markdown-links.js';

describe('utils/extract-relative-markdown-links', () => {
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
  it('should check prose links around a Markdown starter containing its own fences', () => {
    const markdown = [
      '[starter](./references/readme.md-example.md)',
      '````markdown',
      '```sh',
      'bun run test',
      '```',
      '[consumer docs](./docs/setup.md)',
      '`````',
      '   ~~~yaml',
      '[sample](./sample)',
      '   ~~~',
      '[contract](./references/contract.md)',
    ].join('\n');

    assert.deepEqual(extractRelativeMarkdownLinks(markdown), [
      './references/readme.md-example.md',
      './references/contract.md',
    ]);
  });
});
