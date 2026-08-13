#!/usr/bin/env bun

import { createTask } from '../lib/task-create-author.js';
import { runTaskJsonCommand } from '../lib/task-json-command.js';

function usage() {
  return `Usage: bun skills/task-author/scripts/create-task.js --input <path|->

Read a JSON Task Author request, print the exact publication plan, and create only when
publication.safetyReviewed, publication.approvedTarget, and publication.approvedDigest
match that plan. Run once without approval to obtain the digest.`;
}

process.exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: 'Task Author create failed',
  execute: createTask,
  failureStatuses: ['blocked', 'publication_blocked', 'partial', 'failed'],
  usage,
});
