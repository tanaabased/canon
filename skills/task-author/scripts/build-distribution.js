#!/usr/bin/env bun

import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDistribution } from '../lib/build-distribution.js';
import config from '../build.config.js';

const skillRoot = fileURLToPath(new URL('..', import.meta.url));
const repositoryRoot = path.resolve(skillRoot, '../..');
const [option, ...extra] = process.argv.slice(2);
const usage = 'Usage: bun run build:task-author [--release | --check]';

async function build(options) {
  const stagingRoot = await mkdtemp(path.join(tmpdir(), 'canon-task-author-'));
  try {
    const stagedSkill = path.join(stagingRoot, 'task-author');
    const result = await buildDistribution({ ...options, outputRoot: stagedSkill });
    if (option === '--release') {
      for (const directory of ['dist', 'references/canon']) {
        await rm(path.join(skillRoot, directory), { recursive: true, force: true });
      }
      const authored = Object.entries(config.resources)
        .filter(([source, destination]) => source === destination)
        .map(([source]) => path.join(stagedSkill, source));
      await cp(stagedSkill, skillRoot, {
        recursive: true,
        filter: (source) => !authored.includes(source),
      });
      return { ...result, outputRoot: path.resolve(skillRoot) };
    }

    const outputRoot = path.join(repositoryRoot, 'dist/task-author');
    await rm(outputRoot, { recursive: true, force: true });
    await cp(stagedSkill, outputRoot, { recursive: true });
    return { ...result, outputRoot };
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}

try {
  if (extra.length === 0 && ['--help', '-h'].includes(option)) {
    process.stdout.write(`${usage}\n`);
    process.exit(0);
  }
  if (extra.length || ![undefined, '--release', '--check'].includes(option)) {
    throw new Error(usage);
  }
  const { version } = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
  const options = { skillRoot, repositoryRoot, config, version };
  const result =
    option === '--check'
      ? await buildDistribution({ ...options, outputRoot: skillRoot, check: true })
      : await build(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
