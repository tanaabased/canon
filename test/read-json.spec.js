import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import readJson from '../utils/read-json.js';

describe('utils/read-json', () => {
  it('should parse JSON file contents', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'canon-read-json-'));
    const targetPath = path.join(tempDir, 'value.json');

    try {
      await writeFile(targetPath, '{"name":"canon"}\n');
      assert.deepEqual(await readJson(targetPath), { name: 'canon' });
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });
});
