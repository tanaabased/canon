import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import collectFiles from '../utils/collect-files.js';

describe('utils/collect-files', () => {
  it('should collect matching files in stable order while skipping dependency directories', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'canon-collect-files-'));

    try {
      await mkdir(path.join(root, 'nested'));
      await mkdir(path.join(root, 'node_modules'));
      await writeFile(path.join(root, 'z.md'), 'z');
      await writeFile(path.join(root, 'nested', 'a.md'), 'a');
      await writeFile(path.join(root, 'nested', 'b.txt'), 'b');
      await writeFile(path.join(root, 'node_modules', 'ignored.md'), 'ignored');

      assert.deepEqual(await collectFiles(root, (filePath) => filePath.endsWith('.md')), [
        path.join(root, 'nested', 'a.md'),
        path.join(root, 'z.md'),
      ]);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it('should return an empty list for a missing path', async () => {
    assert.deepEqual(await collectFiles('/path/that/does/not/exist', () => true), []);
  });
});
