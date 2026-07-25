import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCAFFOLDER_PATH = path.resolve(TEST_DIR, '..', 'scripts', 'init-skill.js');

describe('skills/skill-author/lib/skill-scaffolder', () => {
  it('should create and validate a skill in a temporary owner scope', async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), 'canon-skill-scaffolder-'));

    try {
      const result = spawnSync(
        'bun',
        [
          SCAFFOLDER_PATH,
          '--type',
          'generic',
          '--slug',
          'example-skill',
          '--display-name',
          'Example Skill',
          '--description',
          'Scaffold a focused example skill.',
          '--output-dir',
          outputDir,
        ],
        { encoding: 'utf8' },
      );
      const skillDir = path.join(outputDir, 'tanaab-example-skill');

      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Created skill at/);
      assert.match(await readFile(path.join(skillDir, 'SKILL.md'), 'utf8'), /^---\n/);
    } finally {
      await rm(outputDir, { force: true, recursive: true });
    }
  });
});
