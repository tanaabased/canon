#!/usr/bin/env bun

import { fileURLToPath } from 'node:url';

import stagePlugin from '../lib/stage-plugin.js';

const args = process.argv.slice(2);
if (args.length !== 1 || args[0].startsWith('-')) {
  process.stderr.write('Usage: bun run build:plugin <new-staging-directory>\n');
  process.exitCode = 1;
} else {
  try {
    const staging = await stagePlugin(fileURLToPath(new URL('../', import.meta.url)), args[0]);
    process.stdout.write(`Staged Canon plugin at ${staging}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
