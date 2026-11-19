import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import stagePlugin from '../lib/stage-plugin.js';
import checkSkillDistribution from '../lib/check-skill-distribution.js';
import config from '../skills/task-author/build.config.js';

const repository = fileURLToPath(new URL('../', import.meta.url));
const skillPath = 'skills/task-author';

describe('plugin staging', function () {
  this.timeout(15000);

  let scratch;

  beforeEach(async () => {
    scratch = await mkdtemp(path.join(tmpdir(), 'canon-plugin-stage-'));
  });

  afterEach(async () => {
    await rm(scratch, { recursive: true, force: true });
  });

  it('materializes skill symlinks and bundles the source entrypoints at their original paths', async () => {
    const staging = path.join(scratch, 'plugin');
    const sourceSkill = path.join(repository, skillPath);
    const original = await readFile(path.join(sourceSkill, 'SKILL.md'), 'utf8');
    const sourceCommand = await readFile(path.join(sourceSkill, 'scripts/draft-task.js'));

    const output = await stagePlugin(repository, staging);
    const skill = path.join(output, skillPath);
    const reference = 'references/task-management-contract.md';
    for (const [resource, kind] of [
      [reference, 'isFile'],
      ['assets', 'isDirectory'],
      ['test/task-management-fixtures.js', 'isFile'],
    ]) {
      assert.ok((await lstat(path.join(sourceSkill, resource))).isSymbolicLink());
      assert.ok((await lstat(path.join(skill, resource)))[kind]());
    }
    assert.deepEqual(
      await readFile(path.join(skill, 'assets/icon-large.png')),
      await readFile(path.join(sourceSkill, 'assets/icon-large.png')),
    );
    const contract = await readFile(path.join(sourceSkill, reference), 'utf8');
    assert.equal(await readFile(path.join(skill, reference), 'utf8'), contract);
    const template = '../templates/task-completion-pull-request.md';
    assert.ok(contract.includes(`](${template})`));
    assert.deepEqual(
      await readFile(path.resolve(skill, 'references', template)),
      await readFile(path.resolve(sourceSkill, 'references', template)),
    );
    const fixture = 'test/task-management-fixtures.js';
    const sourceFixtures = await import(pathToFileURL(path.join(sourceSkill, fixture)));
    const stagedFixtures = await import(pathToFileURL(path.join(skill, fixture)));
    assert.deepEqual(
      stagedFixtures.organizationCapabilities(),
      sourceFixtures.organizationCapabilities(),
    );
    assert.equal(await readFile(path.join(sourceSkill, 'SKILL.md'), 'utf8'), original);
    assert.deepEqual(
      await readFile(path.join(sourceSkill, 'scripts/draft-task.js')),
      sourceCommand,
    );

    const fragment = (
      await readFile(path.join(repository, 'templates/packaged-command-execution.md'), 'utf8')
    ).trim();
    assert.ok(original.includes('<!-- packaged-execution -->'));
    assert.equal(
      await readFile(path.join(skill, 'SKILL.md'), 'utf8'),
      original.replace('<!-- packaged-execution -->', fragment),
    );
    await assert.rejects(lstat(path.join(output, 'templates/packaged-command-execution.md')), {
      code: 'ENOENT',
    });
    const prose = 'skills/changelog-author/SKILL.md';
    assert.deepEqual(
      await readFile(path.join(output, prose)),
      await readFile(path.join(repository, prose)),
    );
    await assert.rejects(lstat(path.join(output, 'skills/changelog-author/runtime-files.json')), {
      code: 'ENOENT',
    });

    const { version, commands } = JSON.parse(
      await readFile(path.join(skill, 'runtime-files.json'), 'utf8'),
    );
    for (const command of commands) {
      const temporary = await mkdtemp(path.join(scratch, 'skill-'));
      const copy = path.join(temporary, command.path);
      await mkdir(path.dirname(copy), { recursive: true });
      await writeFile(copy, await readFile(path.join(skill, command.path)));
      const bytes = await readFile(copy);
      assert.equal(bytes.length, command.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), command.sha256);
      const usage = execFileSync(process.execPath, [copy, '--help'], {
        cwd: scratch,
        encoding: 'utf8',
      });
      assert.match(usage, /Usage:/);
    }

    const alternate = path.join(scratch, 'external-cwd');
    execFileSync(process.execPath, [path.join(repository, 'bin/build-plugin.js'), alternate], {
      cwd: scratch,
    });
    assert.deepEqual(
      await readFile(path.join(alternate, skillPath, 'runtime-files.json')),
      await readFile(path.join(skill, 'runtime-files.json')),
    );

    const bundle = path.join(skill, 'scripts/draft-task.js');
    const contents = await readFile(bundle);
    contents[0] ^= 1;
    await writeFile(bundle, contents);
    await assert.rejects(checkSkillDistribution(skill, version, config), /Incorrect hash/);
  });

  it('rejects a symlink to untracked content and removes the failed staging directory', async () => {
    const checkout = path.join(scratch, 'checkout');
    const skill = path.join(checkout, skillPath);
    await mkdir(skill, { recursive: true });
    await writeFile(path.join(checkout, 'untracked.txt'), 'fixture data');
    await symlink('../../untracked.txt', path.join(skill, 'resource.txt'));
    execFileSync('git', ['init', '-q'], { cwd: checkout });
    execFileSync('git', ['add', skillPath], { cwd: checkout });

    const staging = path.join(scratch, 'plugin');
    await assert.rejects(stagePlugin(checkout, staging), /Symlink must point to tracked/);
    await assert.rejects(lstat(staging), { code: 'ENOENT' });
  });
});
