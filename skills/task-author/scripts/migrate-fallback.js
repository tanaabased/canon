#!/usr/bin/env bun

import { readFileSync } from 'node:fs';

import { migrateTaskFallback } from '../lib/task-fallback-migrator.js';

try {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(
      'Usage: bun skills/task-author/scripts/migrate-fallback.js --input <path|->\n',
    );
    process.exit(0);
  }
  const index = argv.indexOf('--input');
  if (index === -1 || !argv[index + 1]) throw new Error('--input <path|-> is required.');
  const path = argv[index + 1];
  const source = path === '-' ? readFileSync(0, 'utf8') : readFileSync(path, 'utf8');
  const result = migrateTaskFallback(JSON.parse(source));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (['blocked', 'publication_blocked', 'partial', 'failed'].includes(result.status)) {
    process.exitCode = 1;
  }
} catch (error) {
  process.stderr.write(`Task Author fallback migration failed: ${error.message}\n`);
  process.exitCode = 1;
}
