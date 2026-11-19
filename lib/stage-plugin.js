import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  readlink,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import { isBuiltin } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { Transpiler } from 'bun';

import checkSkillDistribution from './check-skill-distribution.js';

const executionTemplate = 'templates/packaged-command-execution.md';

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

    if (!/^skills\/[^/]+\//.test(file) || path.isAbsolute(await readlink(source))) {
      throw new Error(`Expected a relative skill resource symlink: ${file}`);
    }
    const relativeTarget = path.relative(repository, await realpath(source));
    if (!relativeTarget || isOutside(relativeTarget)) {
      throw new Error(`Symlink must point to tracked checkout content: ${file}`);
    }
    const target = relativeTarget.split(path.sep).join('/');
    const members = files.filter(
      (entry) =>
        entry !== executionTemplate && (entry === target || entry.startsWith(`${target}/`)),
    );
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

async function bundleCommand(repository, skill, entry, staging) {
  const output = await mkdtemp(path.join(tmpdir(), 'canon-command-'));
  try {
    // BUN uses the working directory in bundle comments.
    execFileSync(
      process.execPath,
      [
        'build',
        entry,
        '--format',
        'esm',
        '--packages',
        'bundle',
        '--target',
        'bun',
        '--outdir',
        output,
      ],
      { cwd: repository },
    );

    const directory = path.posix.dirname(path.posix.relative(skill, entry));
    const commandName = path.posix.basename(entry);
    const resources = [];
    let command;
    for (const name of (await readdir(output)).sort()) {
      const bytes = await readFile(path.join(output, name));
      const relative = path.posix.join(directory, name);
      const record = {
        path: relative,
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      };
      if (name === commandName) {
        const scanner = new Transpiler({ loader: 'js' });
        const imports = scanner.scanImports(bytes.toString('utf8').replace(/^#![^\n]*\n/, ''));
        if (imports.some(({ path: imported }) => !isBuiltin(imported))) {
          throw new Error(`Bundle has runtime dependencies outside Bun: ${entry}`);
        }
        command = record;
      } else {
        resources.push(record);
      }
      await writeFile(path.join(staging, skill, relative), bytes);
    }
    if (!command) throw new Error(`Missing bundled entrypoint: ${entry}`);
    return resources.length ? { ...command, resources } : command;
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}

async function prepareSkill(repository, staging, files, version, configPath) {
  const skillPath = path.posix.dirname(configPath);
  const { default: config } = await import(pathToFileURL(path.join(repository, configPath)));
  const commandDirectory = path.posix.join(skillPath, config.entrypointDirectory);
  const entries = files.filter(
    (file) => path.posix.dirname(file) === commandDirectory && file.endsWith('.js'),
  );
  if (!entries.length) throw new Error(`No JavaScript entrypoints in ${commandDirectory}`);

  const commands = [];
  for (const entry of entries) {
    commands.push(await bundleCommand(repository, skillPath, entry, staging));
  }
  const skill = path.join(staging, skillPath);
  const instructions = path.join(skill, 'SKILL.md');
  const content = await readFile(instructions, 'utf8');
  const sections = content.split('<!-- packaged-execution -->');
  if (sections.length > 2) throw new Error(`Repeated packaged execution marker: ${skillPath}`);
  if (sections.length === 2) {
    const fragment = await readFile(path.join(staging, executionTemplate), 'utf8');
    await writeFile(instructions, sections.join(fragment.trim()));
  }
  await writeFile(
    path.join(skill, 'runtime-files.json'),
    `${JSON.stringify({ version, runtime: 'bun', commands }, null, 2)}\n`,
  );
  await checkSkillDistribution(skill, version, config);
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
    for (const config of files.filter((file) => /^skills\/[^/]+\/build\.config\.js$/.test(file))) {
      await prepareSkill(repository, staging, files, version, config);
    }
    await rm(path.join(staging, executionTemplate), { force: true });
    return staging;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}
