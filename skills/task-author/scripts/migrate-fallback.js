#!/usr/bin/env bun

import { migrateTaskFallback } from '../lib/task-fallback-migrator.js';
import { runTaskJsonCommand } from '../lib/task-json-command.js';

function usage() {
  return 'Usage: bun skills/task-author/scripts/migrate-fallback.js --input <path|->';
}

process.exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: 'Task Author fallback migration failed',
  execute: migrateTaskFallback,
  failureStatuses: ['blocked', 'publication_blocked', 'partial', 'failed'],
  usage,
});
