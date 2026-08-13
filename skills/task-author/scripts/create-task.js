#!/usr/bin/env bun

import { readFileSync } from 'node:fs';

import { createTask } from '../lib/task-create-author.js';

function usage() {
  return `Usage: bun skills/task-author/scripts/create-task.js --input <path|->

Read a JSON Task Author request, print the exact publication plan, and create only when
publication.safetyReviewed, publication.approvedTarget, and publication.approvedDigest
match that plan. Run once without approval to obtain the digest.`;
}

function parseArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) return { help: true };
  const inputIndex = argv.indexOf('--input');
  if (inputIndex === -1 || !argv[inputIndex + 1]) {
    throw new Error('--input <path|-> is required.');
  }
  return { inputPath: argv[inputIndex + 1] };
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }
  const source =
    args.inputPath === '-' ? readFileSync(0, 'utf8') : readFileSync(args.inputPath, 'utf8');
  const result = createTask(JSON.parse(source));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (['blocked', 'publication_blocked', 'partial', 'failed'].includes(result.status)) {
    process.exitCode = 1;
  }
} catch (error) {
  process.stderr.write(`Task Author create failed: ${error.message}\n`);
  process.exitCode = 1;
}
