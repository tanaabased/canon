#!/usr/bin/env bun

import { bold, dim, fail, renderCliHelp, writeLine } from '../../../lib/bun-cli-support.js';
import { createGitHubTaskClient } from '../lib/github-task-client.js';
import { inspectTaskCompletion } from '../lib/task-completion-inspector.js';
import parseTaskCompletionArgs, {
  DEFAULT_CONTEXT_LINES,
  DEFAULT_MAX_LINES,
} from '../utils/parse-task-completion-args.js';
import renderTaskCompletion from '../utils/render-task-completion.js';

function renderUsage(stream = process.stdout) {
  return renderCliHelp(
    {
      usage: `Usage: ${bold('check-task-completion.js', stream)} ${dim(
        'OWNER/REPO#NUMBER [options]',
        stream,
      )}`,
      summary:
        'Inspect a GitHub-backed task, its acceptance criteria, linked pull requests, and validation evidence without mutating GitHub.',
      options: [
        '  --pr <value>            additional PR number, URL, or OWNER/REPO#NUMBER; repeatable',
        `  --max-lines <count>     maximum failure snippet size ${dim(`[default: ${DEFAULT_MAX_LINES}]`, stream)}`,
        `  --context <count>       lines around the failure marker ${dim(`[default: ${DEFAULT_CONTEXT_LINES}]`, stream)}`,
        '  --json                  emit JSON instead of text output',
        '  -h, --help              show this message',
      ],
    },
    stream,
  );
}

async function main() {
  const options = parseTaskCompletionArgs(process.argv.slice(2));
  if (options.help) {
    writeLine(process.stdout, renderUsage());
    return true;
  }

  const report = inspectTaskCompletion(options, createGitHubTaskClient());
  writeLine(
    process.stdout,
    options.json ? JSON.stringify(report, null, 2) : renderTaskCompletion(report),
  );
  return report.status === 'complete' || report.status === 'ready';
}

try {
  const ok = await main();
  if (!ok) process.exitCode = 1;
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
