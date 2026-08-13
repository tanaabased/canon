#!/usr/bin/env bun

import { readFileSync } from 'node:fs';
import { authorTaskDraft } from '../lib/task-draft-author.js';

function usage() {
  return `Usage: bun skills/task-author/scripts/draft-task.js --input <path|->

Read a JSON Task Author request and print a read-only GitHub capability-aware draft.
This command never creates or changes a GitHub issue, field, label, relationship, or comment.`;
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
  const result = authorTaskDraft(JSON.parse(source));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Task Author failed: ${error.message}\n`);
  process.exitCode = 1;
}
