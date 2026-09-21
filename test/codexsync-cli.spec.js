import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveCodexsyncContext } from '../lib/codexsync-context.js';

const cli = fileURLToPath(new URL('../bin/codexsync.js', import.meta.url));
const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

describe('bin/codexsync', () => {
  let root;
  let repoRoot;
  let cachePath;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'canon-cli-test-'));
    repoRoot = path.join(root, 'source');
    cachePath = path.join(root, 'cache');
    await mkdir(path.join(repoRoot, '.codex-plugin'), { recursive: true });
    await writeFile(path.join(repoRoot, 'package.json'), JSON.stringify({ version: '1.2.3' }));
    await writeFile(
      path.join(repoRoot, '.codex-plugin', 'plugin.json'),
      JSON.stringify({ name: 'fixture', version: '4.5.6' }),
    );
    await writeFile(path.join(repoRoot, 'payload'), 'source');
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  function run(...args) {
    const result = spawnSync(
      'bun',
      [cli, ...args, '--repo-root', repoRoot, '--cache-path', cachePath],
      {
        cwd: root,
        env: { ...process.env, NO_COLOR: '1', CODEX_HOME: path.join(root, 'unused-codex-home') },
        encoding: 'utf8',
      },
    );
    assert.ifError(result.error);
    return result;
  }

  it('should retain pirostore and package-version defaults while honoring explicit targets', async () => {
    const context = await resolveCodexsyncContext({ repoRoot });
    assert.equal(
      context.cachePath,
      path.join(homedir(), '.codex/plugins/cache/pirostore/fixture/1.2.3'),
    );
    assert.equal(
      (await resolveCodexsyncContext({ repoRoot, cachePathOverride: cachePath })).cachePath,
      cachePath,
    );
  });

  it('should report a missing raw target, create it, and converge without claiming installation', async () => {
    let result = run('check');
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /missing.*payload/s);
    assert.ok(result.stdout.includes(`repo: ${repoRoot}`));
    assert.ok(result.stdout.includes(`cache: ${cachePath}`));
    await assert.rejects(lstat(cachePath), { code: 'ENOENT' });
    result = run('sync');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /cache copy synced/);
    assert.doesNotMatch(result.stdout, /plugin installed|installation successful/i);
    assert.equal(await readFile(path.join(cachePath, 'payload'), 'utf8'), 'source');
    assert.equal(run('check').status, 0);
    const before = await lstat(path.join(cachePath, 'payload'));
    assert.equal(run('sync').status, 0);
    assert.equal((await lstat(path.join(cachePath, 'payload'))).mtimeMs, before.mtimeMs);
  });

  it('should repair malformed cached metadata as ordinary drift', async () => {
    assert.equal(run('sync').status, 0);
    await writeFile(path.join(cachePath, '.codex-plugin', 'plugin.json'), '{broken');
    assert.equal(run('check').status, 1);
    assert.equal(run('sync').status, 0);
    assert.equal(run('check').status, 0);
  });

  it('should fail on source metadata errors and target aliases without changing the source', async () => {
    await symlink(repoRoot, cachePath);
    const result = run('sync');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /disjoint/);
    assert.equal(await readFile(path.join(repoRoot, 'payload'), 'utf8'), 'source');
    await writeFile(path.join(repoRoot, 'package.json'), '{broken');
    assert.equal(run('check').status, 1);
    assert.equal(run('sync').status, 1);
  });

  it('should preserve help, the executable version, and CLI input failures', () => {
    assert.match(run('--help').stdout, /check\|validate\|sync/);
    assert.equal(run('--version').stdout.trim(), packageJson.version);
    for (const args of [
      [],
      ['unknown'],
      ['check', 'extra'],
      ['--unknown'],
      ['check', '--cache-path='],
    ]) {
      const result = run(...args);
      assert.equal(result.status, 1, JSON.stringify(args));
      assert.match(
        result.stderr,
        /expected a command|unknown command|unexpected positional|Unknown option|Missing value/,
      );
    }
  });

  async function prepareValidation() {
    await mkdir(path.join(repoRoot, 'skills', 'skill-author', 'scripts'), { recursive: true });
    await writeFile(
      path.join(repoRoot, 'skills', 'skill-author', 'scripts', 'validate-skill.js'),
      "if (process.argv[2] !== '--skill-dir' || !process.argv[3].endsWith('skill-author')) process.exit(1);\n",
    );
    await writeFile(path.join(repoRoot, 'icon.svg'), '<svg/>');
    await writeFile(
      path.join(repoRoot, '.codex-plugin', 'plugin.json'),
      JSON.stringify({
        name: 'fixture',
        skills: './skills',
        interface: { composerIcon: './icon.svg', logo: './icon.svg' },
      }),
    );
    await mkdir(path.join(repoRoot, '.github', 'workflows'), { recursive: true });
  }

  it('should preserve local validation and required manifest paths', async () => {
    await prepareValidation();
    const valid = run('validate');
    assert.equal(valid.status, 0, valid.stderr);
    await rm(path.join(repoRoot, 'icon.svg'));
    const invalid = run('validate');
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /interface.composerIcon.*missing path/);
    assert.match(invalid.stderr, /interface.logo.*missing path/);
  });

  it('should preserve Skill Author invocation and propagate its failures', async () => {
    await prepareValidation();
    await writeFile(
      path.join(repoRoot, 'skills', 'skill-author', 'scripts', 'validate-skill.js'),
      "console.error('skill validation sentinel'); process.exit(1);\n",
    );
    const result = run('validate');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /skill validation failed.*skill-author/);
    assert.match(result.stderr, /skill validation sentinel/);
  });

  it('should preserve configured Markdown roots and workflow package-script validation', async () => {
    await prepareValidation();
    for (const directory of ['guidance', 'ideas', 'references', 'prompts', 'templates']) {
      await mkdir(path.join(repoRoot, directory));
      await writeFile(path.join(repoRoot, directory, 'broken.md'), '[missing](./missing.md)');
    }
    for (const file of ['README.md', 'CHANGELOG.md', 'AGENTS.md']) {
      await writeFile(path.join(repoRoot, file), '[missing](./missing.md)');
    }
    await writeFile(
      path.join(repoRoot, '.github', 'workflows', 'test.yml'),
      'run: bun run missing-script',
    );
    const result = run('validate');
    assert.equal(result.status, 1);
    assert.equal(result.stderr.match(/broken Markdown link/g)?.length, 8);
    assert.match(result.stderr, /missing package script: missing-script/);
  });
});
