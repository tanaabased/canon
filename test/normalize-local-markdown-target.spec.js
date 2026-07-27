import assert from 'node:assert/strict';

import normalizeLocalMarkdownTarget from '../utils/normalize-local-markdown-target.js';

describe('utils/normalize-local-markdown-target', () => {
  it('should normalize local targets, titles, angle brackets, and fragments', () => {
    assert.equal(normalizeLocalMarkdownTarget('./README.md#usage'), './README.md');
    assert.equal(normalizeLocalMarkdownTarget('<../guidance/file.md>'), '../guidance/file.md');
    assert.equal(normalizeLocalMarkdownTarget('./file.md "Title"'), './file.md');
  });

  it('should reject anchors, external schemes, and templated targets', () => {
    assert.equal(normalizeLocalMarkdownTarget('#usage'), null);
    assert.equal(normalizeLocalMarkdownTarget('https://example.com/docs'), null);
    assert.equal(normalizeLocalMarkdownTarget('{{ DOCS_PATH }}'), null);
  });
});
