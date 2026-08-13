#!/usr/bin/env bun

import { authorTaskDraft } from '../lib/task-draft-author.js';
import { runTaskJsonCommand } from '../lib/task-json-command.js';

function usage() {
  return `Usage: bun skills/task-author/scripts/draft-task.js --input <path|->

Read a JSON Task Author request and print a read-only GitHub capability-aware draft.
This command never creates or changes a GitHub issue, field, label, relationship, or comment.`;
}

process.exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: 'Task Author failed',
  execute: authorTaskDraft,
  usage,
});
