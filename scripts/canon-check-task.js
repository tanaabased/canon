#!/usr/bin/env bun

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const CODEXSYNC_BIN = path.resolve(MODULE_DIR, '..', 'bin', 'codexsync.js');

const result = spawnSync(process.execPath, [CODEXSYNC_BIN, 'validate', ...process.argv.slice(2)], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
