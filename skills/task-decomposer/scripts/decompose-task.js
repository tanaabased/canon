#!/usr/bin/env bun

import { runTaskJsonCommand } from '../../task-author/lib/task-json-command.js';
import { GitHubTaskDecomposerClient } from '../lib/github-task-decomposer-client.js';
import { publishTaskDecomposition } from '../lib/task-decomposition-publisher.js';

function usage() {
  return `Usage: decompose-task.js --input <path|->

Preview or apply one exact task-decomposition request supplied as JSON.
Use --input - and send the request through standard input. A request without a matching
publication digest remains read-only and returns the complete preview plus required digest.`;
}

const exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: 'Task decomposition failed',
  execute: (input) => publishTaskDecomposition(input, { client: new GitHubTaskDecomposerClient() }),
  failureStatuses: ['blocked', 'failed', 'partial', 'publication_blocked'],
  usage,
});
process.exitCode = exitCode;
