#!/usr/bin/env bun

import { mkdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';

import { runCloud, snapshotCheckout, sourceRoot } from '../lib/package-checkout.js';

async function stagePlugin(destination) {
  const requested = path.resolve(destination);
  const staging = path.join(await realpath(path.dirname(requested)), path.basename(requested));
  const relative = path.relative(await realpath(sourceRoot), staging);
  if (!relative.startsWith(`..${path.sep}`) && !relative.startsWith(`dist${path.sep}`)) {
    throw new Error('Choose a new staging directory outside the checkout or under dist/.');
  }

  await mkdir(staging);
  try {
    await snapshotCheckout(sourceRoot, staging);
    runCloud('package', staging);
    await rm(path.join(staging, '.git'), { recursive: true });
    return staging;
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}

const args = process.argv.slice(2);
if (args.length !== 1 || args[0].startsWith('-')) {
  process.stderr.write('Usage: bun run build:plugin <new-staging-directory>\n');
  process.exitCode = 1;
} else {
  try {
    const staging = await stagePlugin(args[0]);
    process.stdout.write(`Staged Canon plugin at ${staging}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
