import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_PATH = path.join(SKILL_ROOT, 'templates', 'bun-cli.js');

describe('skills/javascript-cli-author/templates/bun-cli', () => {
  it('should build and expose help and version output from the built artifact', async () => {
    const buildDir = await mkdtemp(path.join(tmpdir(), 'canon-bun-cli-template-'));
    const outputPath = path.join(buildDir, 'bun-cli.js');

    try {
      const build = spawnSync(
        'bun',
        ['build', TEMPLATE_PATH, '--target=bun', `--outfile=${outputPath}`],
        { encoding: 'utf8' },
      );
      assert.equal(build.status, 0, build.stderr || build.stdout);

      const help = spawnSync('bun', [outputPath, '--help'], {
        encoding: 'utf8',
        env: { ...process.env, NO_COLOR: '1' },
      });
      assert.equal(help.status, 0, help.stderr);
      assert.match(help.stdout, /^Usage: bun-cli\.js /m);
      assert.match(help.stdout, /^Options:$/m);
      assert.match(help.stdout, /^Environment Variables:$/m);

      const version = spawnSync('bun', [outputPath, '--version'], { encoding: 'utf8' });
      assert.equal(version.status, 0, version.stderr);
      assert.match(version.stdout.trim(), /^(?:v?\d|[0-9a-f]{4,})/i);
    } finally {
      await rm(buildDir, { force: true, recursive: true });
    }
  });
});
