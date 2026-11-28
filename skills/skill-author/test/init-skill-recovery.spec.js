import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const initSkill = fileURLToPath(new URL('../scripts/init-skill.js', import.meta.url));

function scaffold(outputDir) {
  return spawnSync(
    process.execPath,
    [
      initSkill,
      '--type',
      'workflow',
      '--slug',
      'recovery-probe',
      '--display-name',
      'Recovery Probe',
      '--description',
      'Test interrupted skill publication recovery.',
      '--openclaw-emoji',
      '🧪',
      '--openclaw-homepage',
      'https://example.com/skill',
      '--container',
      'standalone',
      '--output-dir',
      outputDir,
      '--force',
    ],
    { encoding: 'utf8' },
  );
}

describe('skills/skill-author interrupted publication', () => {
  for (const hasDestination of [false, true]) {
    it(`preserves publication state with ${hasDestination ? 'both copies' : 'only a backup'}`, async () => {
      const outputDir = await mkdtemp(path.join(tmpdir(), 'skill-author-recovery-'));
      try {
        const destination = path.join(outputDir, 'tanaab-recovery-probe');
        const lock = path.join(outputDir, '.tanaab-recovery-probe.publish');
        const backup = path.join(lock, 'previous');
        await mkdir(backup, { recursive: true });
        await writeFile(path.join(backup, 'marker'), 'original');
        if (hasDestination) {
          await mkdir(destination);
          await writeFile(path.join(destination, 'marker'), 'published');
        }

        const blocked = scaffold(outputDir);
        assert.ifError(blocked.error);
        assert.equal(blocked.status, 1, blocked.stderr);
        assert.equal(await readFile(path.join(backup, 'marker'), 'utf8'), 'original');
        if (hasDestination) {
          assert.equal(await readFile(path.join(destination, 'marker'), 'utf8'), 'published');
        } else {
          await assert.rejects(stat(destination), { code: 'ENOENT' });
        }
        assert.ok(blocked.stderr.includes(`Destination: ${destination}`), blocked.stderr);
        assert.ok(blocked.stderr.includes(`Publication lock: ${lock}`), blocked.stderr);
        assert.ok(blocked.stderr.includes(`Possible backup: ${backup}`), blocked.stderr);
        assert.match(blocked.stderr, /running init-skill\.js processes/);

        const archive = path.join(outputDir, 'saved-publication-lock');
        await rename(lock, archive);
        const preservedSkill = path.join(outputDir, 'saved-destination');
        if (hasDestination) await rename(destination, preservedSkill);

        const retried = scaffold(outputDir);
        assert.ifError(retried.error);
        assert.equal(retried.status, 0, retried.stderr);
        assert.match(
          await readFile(path.join(destination, 'SKILL.md'), 'utf8'),
          /name: tanaab-recovery-probe/,
        );
        assert.equal(await readFile(path.join(archive, 'previous', 'marker'), 'utf8'), 'original');
        if (hasDestination) {
          assert.equal(await readFile(path.join(preservedSkill, 'marker'), 'utf8'), 'published');
        }
        await assert.rejects(stat(lock), { code: 'ENOENT' });
      } finally {
        await rm(outputDir, { recursive: true, force: true });
      }
    });
  }
});
