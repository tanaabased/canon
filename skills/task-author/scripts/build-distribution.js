#!/usr/bin/env bun

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDistribution } from '../lib/build-distribution.js';
import config from '../build.config.js';

const skillRoot = fileURLToPath(new URL('..', import.meta.url));
const repositoryRoot = path.resolve(skillRoot, '../..');
const args = process.argv.slice(2);

try {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    process.stdout.write('Usage: bun run build:task-author [--check]\n');
    process.exit(0);
  }
  if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
    throw new Error('Usage: bun run build:task-author [--check]');
  }
  const { version } = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'));
  const result = await buildDistribution({
    skillRoot,
    repositoryRoot,
    outputRoot: skillRoot,
    check: args[0] === '--check',
    config,
    version,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
