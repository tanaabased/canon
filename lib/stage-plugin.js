import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { isBuiltin } from 'node:module';
import path from 'node:path';

import { Transpiler } from 'bun';

import taskAuthorBuild from '../skills/task-author/build.config.js';
import checkTaskAuthorDistribution from '../skills/task-author/lib/check-distribution.js';

const skillPath = 'skills/task-author';

function isOutside(relativePath) {
  return (
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  );
}

async function copyTrackedFile(source, output) {
  if ((await realpath(source)) !== source || !(await lstat(source)).isFile()) {
    throw new Error(`Expected a regular tracked file: ${source}`);
  }
  await mkdir(path.dirname(output), { recursive: true });
  await copyFile(source, output);
}

async function copyCheckout(repository, staging, files) {
  for (const file of files) {
    const source = path.join(repository, file);
    const output = path.join(staging, file);
    if (!(await lstat(source)).isSymbolicLink()) {
      await copyTrackedFile(source, output);
      continue;
    }

    if (!file.startsWith(`${skillPath}/`)) throw new Error(`Unexpected checkout symlink: ${file}`);
    const relativeTarget = path.relative(repository, await realpath(source));
    if (!relativeTarget || isOutside(relativeTarget)) {
      throw new Error(`Symlink must point to tracked checkout content: ${file}`);
    }
    const target = relativeTarget.split(path.sep).join('/');
    const members = files.filter((entry) => entry === target || entry.startsWith(`${target}/`));
    if (!members.length) {
      throw new Error(`Symlink must point to tracked checkout content: ${file}`);
    }
    for (const member of members) {
      await copyTrackedFile(
        path.join(repository, member),
        path.join(output, path.relative(target, member)),
      );
    }
  }
}

async function prepareTaskAuthor(repository, staging, files, version) {
  const { entrypointDirectory, packagedExecution } = taskAuthorBuild;
  const commandDirectory = path.posix.join(skillPath, entrypointDirectory);
  const entries = files.filter(
    (file) => path.posix.dirname(file) === commandDirectory && file.endsWith('.js'),
  );
  if (!entries.length) throw new Error(`No JavaScript entrypoints in ${commandDirectory}`);

  const scanner = new Transpiler({ loader: 'js' });
  const commands = [];
  for (const entry of entries) {
    const source = await realpath(path.join(repository, entry));
    // Bun's module comments depend on cwd, so compile from the checkout.
    const bundle = execFileSync(
      process.execPath,
      ['build', source, '--format', 'esm', '--packages', 'bundle', '--target', 'bun'],
      { cwd: repository, maxBuffer: 10 * 1024 * 1024 },
    );
    const imports = scanner.scanImports(bundle.toString('utf8').replace(/^#![^\n]*\n/, ''));
    if (imports.some(({ path: imported }) => !isBuiltin(imported))) {
      throw new Error(`Bundle has runtime dependencies outside Bun: ${entry}`);
    }
    await writeFile(path.join(staging, entry), bundle);
    commands.push({
      path: path.posix.relative(skillPath, entry),
      bytes: bundle.length,
      sha256: createHash('sha256').update(bundle).digest('hex'),
    });
  }

  const skill = path.join(staging, skillPath);
  if (packagedExecution) {
    const instructions = path.join(skill, 'SKILL.md');
    const content = await readFile(instructions, 'utf8');
    const sections = content.split('<!-- packaged-execution -->');
    if (sections.length !== 2) throw new Error('Expected one packaged execution marker');
    const fragment = await readFile(path.join(skill, packagedExecution), 'utf8');
    await writeFile(instructions, sections.join(fragment.trim()));
  }
  await writeFile(
    path.join(skill, 'runtime-files.json'),
    `${JSON.stringify({ version, runtime: 'bun', commands }, null, 2)}\n`,
  );
  await checkTaskAuthorDistribution(skill, version);
}

export default async function stagePlugin(sourceRoot, destination) {
  const repository = await realpath(sourceRoot);
  const requested = path.resolve(destination);
  const staging = path.join(await realpath(path.dirname(requested)), path.basename(requested));
  const location = path.relative(repository, staging);
  if (!isOutside(location) && !location.startsWith(`dist${path.sep}`)) {
    throw new Error('Choose a new staging directory outside the checkout or under dist/.');
  }

  const files = execFileSync('git', ['ls-files', '--cached', '-z'], {
    cwd: repository,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)
    .sort();
  await mkdir(staging);
  try {
    await copyCheckout(repository, staging, files);
    const { version } = JSON.parse(await readFile(path.join(staging, 'package.json'), 'utf8'));
    await prepareTaskAuthor(repository, staging, files, version);
    return staging;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}
