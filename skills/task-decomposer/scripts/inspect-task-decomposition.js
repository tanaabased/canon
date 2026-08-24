#!/usr/bin/env bun

import { bold, dim, fail, renderCliHelp, writeLine } from '../../../lib/bun-cli-support.js';
import { GitHubTaskDecomposerClient } from '../lib/github-task-decomposer-client.js';
import { inspectTaskDecompositionEvidence } from '../lib/task-decomposition-inspector.js';
import parseTaskDecomposerArgs from '../utils/parse-task-decomposer-args.js';
import renderTaskDecompositionEvidence from '../utils/render-task-decomposition-evidence.js';

function renderUsage(stream = process.stdout) {
  return renderCliHelp(
    {
      usage: `Usage: ${bold('inspect-task-decomposition.js', stream)} ${dim(
        'OWNER/REPO#NUMBER [--json]',
        stream,
      )}`,
      summary:
        'Collect canonical task, relationship, linked-work, and repository-candidate evidence without mutating GitHub.',
      options: [
        '  --json                  emit the complete normalized evidence package',
        '  -h, --help              show this message',
      ],
    },
    stream,
  );
}

function main() {
  const options = parseTaskDecomposerArgs(process.argv.slice(2));
  if (options.help) {
    writeLine(process.stdout, renderUsage());
    return true;
  }
  const report = inspectTaskDecompositionEvidence(options.target, new GitHubTaskDecomposerClient());
  writeLine(
    process.stdout,
    options.json ? JSON.stringify(report, null, 2) : renderTaskDecompositionEvidence(report),
  );
  return report.status === 'ready';
}

try {
  if (!main()) process.exitCode = 1;
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
