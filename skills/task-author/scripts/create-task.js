#!/usr/bin/env bun

import { createTask } from '../lib/task-create-author.js';
import { runTaskJsonCommand, TASK_JSON_INPUT_GUIDANCE } from '../lib/task-json-command.js';

function usage() {
  return `Usage: bun skills/task-author/scripts/create-task.js --input <path|->

Read a JSON Task Author request, print the exact publication plan, and create only when
publication.safetyReviewed, publication.approvedTarget, and publication.approvedDigest
match that plan. Run once without approval to obtain the digest. An agent may inspect and
apply both passes in one turn when an explicit imperative already authorizes the bounded plan.

${TASK_JSON_INPUT_GUIDANCE}`;
}

process.exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: 'Task Author create failed',
  execute: createTask,
  failureStatuses: ['blocked', 'publication_blocked', 'partial', 'failed'],
  usage,
});
