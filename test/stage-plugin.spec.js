import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import stagePlugin from '../lib/stage-plugin.js';
import checkTaskAuthorDistribution from '../skills/task-author/lib/check-distribution.js';

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
    const reference = 'canon/references/task-management-contract.md';
    assert.ok((await lstat(path.join(sourceSkill, 'canon/references'))).isSymbolicLink());
    assert.ok((await lstat(path.join(skill, 'canon/references'))).isDirectory());
    assert.deepEqual(
      await readFile(path.join(skill, reference)),
      await readFile(path.join(sourceSkill, reference)),
    );
    const fixture = 'canon/test/task-management-fixtures.js';
    assert.ok((await lstat(path.join(skill, fixture))).isFile());
    const sourceFixtures = await import(pathToFileURL(path.join(sourceSkill, fixture)));
    const stagedFixtures = await import(pathToFileURL(path.join(skill, fixture)));
    assert.deepEqual(stagedFixtures.completeTaskSections, sourceFixtures.completeTaskSections);
    assert.equal(await readFile(path.join(sourceSkill, 'SKILL.md'), 'utf8'), original);
    assert.deepEqual(
      await readFile(path.join(sourceSkill, 'scripts/draft-task.js')),
      sourceCommand,
    );

    const instructions = await readFile(path.join(skill, 'SKILL.md'), 'utf8');
    assert.equal(instructions.match(/^### Packaged Command Execution$/gm)?.length, 1);
    const { version, commands } = JSON.parse(
      await readFile(path.join(skill, 'runtime-files.json'), 'utf8'),
    );
    assert.equal(commands.length, 4);
    for (const { path: command } of commands) {
      const copy = path.join(scratch, path.basename(command));
      await writeFile(copy, await readFile(path.join(skill, command)));
      const usage = execFileSync(process.execPath, [copy, '--help'], { encoding: 'utf8' });
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
    await assert.rejects(checkTaskAuthorDistribution(skill, version), /Incorrect hash/);
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
