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
  it('resolves reference links and images while ignoring code and unused definitions', () => {
    const markdown = [
      '[read the guide][guide] and ![logo][]',
      '`[literal](./missing)`',
      '',
      '[guide]: <./the guide.md> "Title"',
      '[logo]: ./assets/logo.svg',
      '[unused]: ./missing',
    ].join('\n');
    assert.deepEqual(extractRelativeMarkdownLinks(markdown), [
      './the guide.md',
      './assets/logo.svg',
    ]);
  });

  it('should check prose links around a Markdown starter containing its own fences', () => {
    const markdown = [
      '[starter](./references/readme-example.md)',
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
      './references/readme-example.md',
      './references/contract.md',
    ]);
  });
});
