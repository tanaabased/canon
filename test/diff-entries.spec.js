import assert from 'node:assert/strict';

import diffEntries from '../utils/diff-entries.js';

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

describe('utils/diff-entries', () => {
  it('should report changed, missing, and extra entries', () => {
    const source = new Map([
      ['content.txt', fileEntry('source')],
      ['link', symlinkEntry('source-target')],
      ['missing.txt', fileEntry('missing')],
    ]);
    const target = new Map([
      ['content.txt', fileEntry('target')],
      ['link', symlinkEntry('target-target')],
      ['extra.txt', fileEntry('extra')],
    ]);

    assert.deepEqual(diffEntries(source, target), {
      changed: ['content.txt', 'link'],
      extra: ['extra.txt'],
      missing: ['missing.txt'],
    });
  });

  it('should report matching entry maps as aligned', () => {
    const source = new Map([['file.txt', fileEntry('same', 0o755)]]);
    const target = new Map([['file.txt', fileEntry('same', 0o755)]]);

    assert.deepEqual(diffEntries(source, target), { changed: [], extra: [], missing: [] });
  });
});
