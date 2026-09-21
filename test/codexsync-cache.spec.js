import assert from 'node:assert/strict';
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { collectEntries, inspectEntries, syncEntries } from '../lib/codexsync-cache.js';

const aligned = { changed: [], extra: [], missing: [] };

describe('lib/codexsync-cache', () => {
  let root;
  let sourceRoot;
  let targetRoot;
  let outside;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'canon-cache-test-'));
    sourceRoot = path.join(root, 'source');
    targetRoot = path.join(root, 'cache');
    outside = path.join(root, 'outside');
    for (const directory of [sourceRoot, targetRoot, outside]) await mkdir(directory);
    await writeFile(path.join(outside, 'child'), 'untouched');
    await writeFile(path.join(sourceRoot, 'sentinel'), 'source');
  });

  afterEach(async () => {
    await rm(root, { force: true, recursive: true });
  });

  for (const relationship of [
    'same',
    'ancestor',
    'descendant',
    'alias',
    'ancestor-alias',
    'new-descendant-alias',
  ]) {
    it(`should reject ${relationship} roots before changing files`, async () => {
      const alias = path.join(root, 'alias');
      await symlink(relationship === 'ancestor-alias' ? root : sourceRoot, alias);
      const targets = {
        same: sourceRoot,
        ancestor: root,
        descendant: path.join(sourceRoot, 'new-cache'),
        alias,
        'ancestor-alias': alias,
        'new-descendant-alias': path.join(alias, 'new', 'cache'),
      };
      const before = await collectEntries(root);
      await assert.rejects(
        syncEntries({ sourceRoot, targetRoot: targets[relationship] }),
        /disjoint/,
      );
      assert.deepEqual(await collectEntries(root), before);
    });
  }

  async function createEntry(directory, type) {
    const entry = path.join(directory, 'entry');
    if (type === 'dir') {
      await mkdir(entry);
      await writeFile(path.join(entry, 'child'), directory === sourceRoot ? 'new' : 'old');
    } else if (type === 'symlink') {
      await symlink(outside, entry);
    } else {
      await writeFile(entry, directory === sourceRoot ? 'new' : 'old');
    }
  }

  for (const sourceType of ['file', 'dir', 'symlink']) {
    for (const targetType of ['file', 'dir', 'symlink']) {
      if (sourceType === targetType) continue;
      it(`should replace a cached ${targetType} with a ${sourceType} without following links`, async () => {
        await createEntry(sourceRoot, sourceType);
        await createEntry(targetRoot, targetType);
        assert.deepEqual(await syncEntries({ sourceRoot, targetRoot }), aligned);
        assert.equal(await readFile(path.join(outside, 'child'), 'utf8'), 'untouched');
      });
    }
  }

  it('should copy bytes and executable modes, remove extras, and preserve ignored paths', async () => {
    await writeFile(path.join(sourceRoot, 'run'), Buffer.from([0, 255, 10]));
    await chmod(path.join(sourceRoot, 'run'), 0o755);
    await mkdir(path.join(targetRoot, 'extra'));
    await writeFile(path.join(targetRoot, 'extra', 'child'), 'remove');
    await mkdir(path.join(targetRoot, '.git'));
    await writeFile(path.join(targetRoot, '.git', 'keep'), 'ignored');
    assert.deepEqual(await syncEntries({ sourceRoot, targetRoot }), aligned);
    assert.deepEqual(await readFile(path.join(targetRoot, 'run')), Buffer.from([0, 255, 10]));
    assert.equal((await lstat(path.join(targetRoot, 'run'))).mode & 0o777, 0o755);
    await assert.rejects(lstat(path.join(targetRoot, 'extra')), { code: 'ENOENT' });
    assert.equal(await readFile(path.join(targetRoot, '.git', 'keep'), 'utf8'), 'ignored');
    const before = await lstat(path.join(targetRoot, 'run'));
    assert.deepEqual(await syncEntries({ sourceRoot, targetRoot }), aligned);
    assert.equal((await lstat(path.join(targetRoot, 'run'))).mtimeMs, before.mtimeMs);
  });

  it('should replace a cached hard link without overwriting its other name', async () => {
    await writeFile(path.join(sourceRoot, 'entry'), 'new');
    await link(path.join(outside, 'child'), path.join(targetRoot, 'entry'));
    assert.deepEqual(await syncEntries({ sourceRoot, targetRoot }), aligned);
    assert.equal(await readFile(path.join(outside, 'child'), 'utf8'), 'untouched');
  });

  it('should create a missing cache beneath an existing directory alias', async () => {
    const alias = path.join(root, 'alias');
    await symlink(targetRoot, alias);
    assert.deepEqual(
      await syncEntries({ sourceRoot, targetRoot: path.join(alias, 'new') }),
      aligned,
    );
    assert.equal(await readFile(path.join(targetRoot, 'new', 'sentinel'), 'utf8'), 'source');
  });

  for (const code of ['EACCES', 'EIO', 'ENOTDIR']) {
    it(`should propagate ${code} metadata errors before any mutation`, async () => {
      await writeFile(path.join(targetRoot, 'extra'), 'keep until inspection succeeds');
      const before = await collectEntries(targetRoot);
      const statPath = async (file) => {
        if (file === path.join(targetRoot, 'extra')) {
          throw Object.assign(new Error('metadata unavailable'), { code });
        }
        return lstat(file);
      };
      await assert.rejects(syncEntries({ sourceRoot, targetRoot, statPath }), { code });
      assert.deepEqual(await collectEntries(targetRoot), before);
    });
  }

  it('should preserve recursively excluded content and converge around excluded-only directories', async () => {
    for (const ignored of ['.git', 'node_modules', '.DS_Store']) {
      for (const directory of [sourceRoot, targetRoot]) {
        const parent = path.join(directory, 'nested', ignored);
        await mkdir(parent, { recursive: true });
        await writeFile(path.join(parent, 'keep'), directory);
      }
    }
    await mkdir(path.join(targetRoot, 'extra', 'node_modules'), { recursive: true });
    await writeFile(path.join(targetRoot, 'extra', 'node_modules', 'keep'), 'untouched');
    await writeFile(path.join(targetRoot, 'extra', 'remove'), 'extra');
    assert.deepEqual(await syncEntries({ sourceRoot, targetRoot }), aligned);
    assert.deepEqual((await inspectEntries({ sourceRoot, targetRoot })).diff, aligned);
    for (const ignored of ['.git', 'node_modules', '.DS_Store']) {
      assert.equal(
        await readFile(path.join(targetRoot, 'nested', ignored, 'keep'), 'utf8'),
        targetRoot,
      );
    }
    assert.equal(
      await readFile(path.join(targetRoot, 'extra', 'node_modules', 'keep'), 'utf8'),
      'untouched',
    );
    await assert.rejects(lstat(path.join(targetRoot, 'extra', 'remove')), { code: 'ENOENT' });
  });

  it('should refuse type replacement that would destroy excluded content before mutation', async () => {
    await writeFile(path.join(sourceRoot, 'entry'), 'replacement');
    await mkdir(path.join(targetRoot, 'entry', 'node_modules'), { recursive: true });
    await writeFile(path.join(targetRoot, 'entry', 'node_modules', 'keep'), 'untouched');
    const before = await collectEntries(root);
    await assert.rejects(syncEntries({ sourceRoot, targetRoot }), /ignored content/);
    assert.deepEqual(await collectEntries(root), before);
    assert.equal(
      await readFile(path.join(targetRoot, 'entry', 'node_modules', 'keep'), 'utf8'),
      'untouched',
    );
  });

  it('should detect mode-only and symlink-target drift and leave matching entries untouched', async () => {
    await writeFile(path.join(sourceRoot, 'run'), 'same bytes');
    await symlink('sentinel', path.join(sourceRoot, 'link'));
    await syncEntries({ sourceRoot, targetRoot });
    const before = await lstat(path.join(targetRoot, 'sentinel'));
    await chmod(path.join(targetRoot, 'run'), 0o700);
    await rm(path.join(targetRoot, 'link'));
    await symlink('run', path.join(targetRoot, 'link'));
    assert.deepEqual((await inspectEntries({ sourceRoot, targetRoot })).diff.changed, [
      'link',
      'run',
    ]);
    assert.deepEqual(await syncEntries({ sourceRoot, targetRoot }), aligned);
    const after = await lstat(path.join(targetRoot, 'sentinel'));
    assert.equal(after.ino, before.ino);
    assert.equal(after.mtimeMs, before.mtimeMs);
  });
});
