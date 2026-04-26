import assert from 'node:assert/strict';

import { diffEntries, previewPaths, summarizeDiff } from '../lib/codexsync-diff.js';

function fileEntry(content, mode = 0o644) {
  return {
    content: Buffer.from(content),
    mode,
    type: 'file',
  };
}

function symlinkEntry(target) {
  return {
    target,
    type: 'symlink',
  };
}

describe('lib/codexsync-diff', () => {
  it('should report no changes for matching entry maps', () => {
    const source = new Map([
      ['file.txt', fileEntry('same')],
      ['link', symlinkEntry('target')],
    ]);
    const target = new Map([
      ['file.txt', fileEntry('same')],
      ['link', symlinkEntry('target')],
    ]);

    assert.deepEqual(diffEntries(source, target), { changed: [], extra: [], missing: [] });
  });

  it('should report changed file content and mode', () => {
    const source = new Map([
      ['content.txt', fileEntry('source')],
      ['mode.txt', fileEntry('same', 0o755)],
    ]);
    const target = new Map([
      ['content.txt', fileEntry('target')],
      ['mode.txt', fileEntry('same', 0o644)],
    ]);

    assert.deepEqual(diffEntries(source, target).changed, ['content.txt', 'mode.txt']);
  });

  it('should report changed symlink targets', () => {
    const source = new Map([['link', symlinkEntry('source-target')]]);
    const target = new Map([['link', symlinkEntry('target-target')]]);

    assert.deepEqual(diffEntries(source, target).changed, ['link']);
  });

  it('should report missing and extra entries', () => {
    const source = new Map([
      ['kept.txt', fileEntry('same')],
      ['missing.txt', fileEntry('source')],
    ]);
    const target = new Map([
      ['kept.txt', fileEntry('same')],
      ['extra.txt', fileEntry('target')],
    ]);

    assert.deepEqual(diffEntries(source, target), {
      changed: [],
      extra: ['extra.txt'],
      missing: ['missing.txt'],
    });
  });

  it('should truncate preview paths', () => {
    assert.deepEqual(previewPaths(['a', 'b', 'c'], 2), ['a', 'b', '... 1 more']);
  });

  it('should summarize diff counts', () => {
    assert.equal(summarizeDiff({ changed: ['a'], extra: ['b', 'c'], missing: [] }), 'changed 1, extra 2');
    assert.equal(summarizeDiff({ changed: [], extra: [], missing: [] }), 'in sync');
  });
});
