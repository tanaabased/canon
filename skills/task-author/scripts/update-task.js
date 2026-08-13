#!/usr/bin/env bun

import { readFileSync } from 'node:fs';

import { updateTask } from '../lib/task-update-author.js';

function usage() {
  return `Usage: bun skills/task-author/scripts/update-task.js --input <path|->

Read a JSON revise or normalize request, print the exact plan, and update only when the
safety attestation, exact OWNER/REPO#NUMBER target, and exact digest are approved.`;
}

try {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }
  const index = argv.indexOf('--input');
  if (index === -1 || !argv[index + 1]) throw new Error('--input <path|-> is required.');
  const path = argv[index + 1];
  const source = path === '-' ? readFileSync(0, 'utf8') : readFileSync(path, 'utf8');
  const result = updateTask(JSON.parse(source));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (['blocked', 'publication_blocked', 'partial', 'failed'].includes(result.status)) {
    process.exitCode = 1;
  }
} catch (error) {
  process.stderr.write(`Task Author update failed: ${error.message}\n`);
  process.exitCode = 1;
}
