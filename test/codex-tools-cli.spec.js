import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checkout = fileURLToPath(new URL('..', import.meta.url));

describe('Codex Tools package scripts', () => {
  let root;
  let repoRoot;
  let cachePath;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'canon-tools-test-'));
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

  function run(command, ...args) {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !key.startsWith('CODEX_TOOLS_')),
    );
    const result = spawnSync(
      'bun',
      [
        'run',
        `codex:${command}`,
        '--repo-root',
        repoRoot,
        '--codex-home',
        path.join(root, 'codex-home'),
        '--json',
        ...args,
      ],
      { cwd: checkout, env, encoding: 'utf8' },
    );
    assert.ifError(result.error);
    return { ...result, body: JSON.parse(result.stdout) };
  }

  function raw(command, ...args) {
    return run(command, '--cache-path', cachePath, '--missing-target', 'create', ...args);
  }

  it('should require installation by default without manufacturing a legacy cache', async () => {
    for (const command of ['check', 'sync']) {
      const result = run(command);
      assert.equal(result.status, 1, result.stderr);
      assert.equal(result.body.status, 'not_installed');
      assert.equal(result.body.cachePath, null);
    }
    await assert.rejects(lstat(path.join(root, 'codex-home')), { code: 'ENOENT' });
  });

  it('should synchronize an explicit whole-tree target without claiming installation', async () => {
    for (const excluded of ['.git', 'node_modules', '.DS_Store']) {
      await mkdir(path.join(repoRoot, 'nested', excluded), { recursive: true });
      await writeFile(path.join(repoRoot, 'nested', excluded, 'ignored'), 'excluded');
    }
    let result = raw('check');
    assert.equal(result.status, 1, result.stderr);
    assert.ok(result.body.diff.missing.includes('payload'));
    await assert.rejects(lstat(cachePath), { code: 'ENOENT' });
    result = raw('sync', '--dry-run');
    assert.equal(result.status, 0, result.stderr);
    await assert.rejects(lstat(cachePath), { code: 'ENOENT' });
    result = raw('sync');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.body.status, 'synchronized_directory');
    assert.equal(result.body.inspection.installed, false);
    assert.equal(result.body.selection.managedPaths, null);
    assert.equal(await readFile(path.join(cachePath, 'payload'), 'utf8'), 'source');
    for (const excluded of ['.git', 'node_modules', '.DS_Store']) {
      await assert.rejects(lstat(path.join(cachePath, 'nested', excluded)), { code: 'ENOENT' });
    }
    assert.equal(raw('check').status, 0);
    const before = await lstat(path.join(cachePath, 'payload'));
    assert.equal(raw('sync').status, 0);
    assert.equal((await lstat(path.join(cachePath, 'payload'))).mtimeMs, before.mtimeMs);
  });

  it('should repair malformed raw-target metadata as drift', async () => {
    assert.equal(raw('sync').status, 0);
    await writeFile(path.join(cachePath, '.codex-plugin', 'plugin.json'), '{broken');
    assert.equal(raw('check').status, 1);
    assert.equal(raw('sync').status, 0);
    assert.equal(raw('check').status, 0);
  });

  it('should propagate source and overlapping-root failures without writing', async () => {
    await symlink(repoRoot, cachePath);
    assert.equal(raw('sync').status, 1);
    assert.equal(await readFile(path.join(repoRoot, 'payload'), 'utf8'), 'source');
    await writeFile(path.join(repoRoot, 'package.json'), '{broken');
    assert.equal(raw('check').status, 2);
    assert.equal(raw('sync').status, 2);
  });
});
