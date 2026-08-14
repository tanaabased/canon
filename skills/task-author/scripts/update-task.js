#!/usr/bin/env bun

import { updateTask } from '../lib/task-update-author.js';
import { runTaskJsonCommand } from '../lib/task-json-command.js';

function usage() {
  return `Usage: bun skills/task-author/scripts/update-task.js --input <path|->

Read a JSON revise or normalize request, print the exact plan, and update only when the
safety attestation, exact OWNER/REPO#NUMBER target, and exact digest are approved. An agent
may inspect and apply both passes in one turn when an explicit imperative already authorizes
the bounded plan.`;
}

process.exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: 'Task Author update failed',
  execute: updateTask,
  failureStatuses: ['blocked', 'publication_blocked', 'partial', 'failed'],
  usage,
});
