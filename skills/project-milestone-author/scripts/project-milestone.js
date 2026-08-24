#!/usr/bin/env bun

import { readFileSync } from 'node:fs';

import { applyMilestone, inspectMilestone, planMilestone } from '../lib/milestone-author.js';

const MODES = Object.freeze({
  apply: applyMilestone,
  draft: planMilestone,
  inspect: inspectMilestone,
});

export function usage() {
  return `Usage: bun skills/project-milestone-author/scripts/project-milestone.js <inspect|draft|apply> --input <path|->

Inspect one exact GitHub milestone, draft its desired-state plan, or apply a freshly approved plan.
All request JSON is read from standard input by default; inspect and draft never write to GitHub.`;
}

/** Run the internal JSON command with injectable boundaries for focused tests. */
export function runProjectMilestoneCommand(
  argv,
  {
    execute = MODES,
    readFile = readFileSync,
    stderr = process.stderr,
    stdout = process.stdout,
  } = {},
) {
  try {
    if (argv.includes('--help') || argv.includes('-h')) {
      stdout.write(`${usage()}\n`);
      return 0;
    }
    const mode = argv[0];
    if (!Object.hasOwn(execute, mode)) throw new Error('Mode must be inspect, draft, or apply.');
    const inputIndex = argv.indexOf('--input');
    if (inputIndex === -1 || !argv[inputIndex + 1])
      throw new Error('--input <path|-> is required.');
    const inputPath = argv[inputIndex + 1];
    const source = inputPath === '-' ? readFile(0, 'utf8') : readFile(inputPath, 'utf8');
    const result = execute[mode](JSON.parse(source));
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    const failed = ['blocked', 'failed', 'partial', 'publication_blocked'].includes(result.status);
    return failed || (mode === 'apply' && result.status === 'approval_required') ? 1 : 0;
  } catch (error) {
    stderr.write(`project milestone command failed: ${error.message}\n`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runProjectMilestoneCommand(process.argv.slice(2));
