#!/usr/bin/env bun

import { migrateTaskFallback } from '../lib/task-fallback-migrator.js';
import { runTaskJsonCommand } from '../lib/task-json-command.js';

function usage() {
  return `Usage: bun skills/task-author/scripts/migrate-fallback.js --input <path|->

Preview and apply one separately bounded fallback migration through exact target and digest
approval. An agent may inspect and apply both passes in one turn after an explicit migration
imperative when the preview contains no material surprise.`;
}

process.exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: 'Task Author fallback migration failed',
  execute: migrateTaskFallback,
  failureStatuses: ['blocked', 'publication_blocked', 'partial', 'failed'],
  usage,
});
