#!/usr/bin/env bun

import { bold, dim, fail, renderCliHelp, writeLine } from '../../../lib/bun-cli-support.js';
import { createGitHubMilestonePlannerClient } from '../lib/github-milestone-planner-client.js';
import { inspectMilestonePlanningEvidence } from '../lib/milestone-planning-evidence.js';
import parseMilestonePlannerArgs from '../utils/parse-milestone-planner-args.js';
import renderMilestonePlanningEvidence from '../utils/render-milestone-planning-evidence.js';

function renderUsage(stream = process.stdout) {
  return renderCliHelp(
    {
      usage: `Usage: ${bold('inspect-milestone-plan.js', stream)} ${dim(
        'OWNER/REPO#MILESTONE_NUMBER [options]',
        stream,
      )}`,
      summary:
        'Collect repository, milestone, task, and pull-request evidence for read-only project milestone planning.',
      options: [
        '  --json                  emit JSON instead of text output',
        '  -h, --help              show this message',
      ],
    },
    stream,
  );
}

async function main() {
  const options = parseMilestonePlannerArgs(process.argv.slice(2));
  if (options.help) {
    writeLine(process.stdout, renderUsage());
    return true;
  }

  const report = inspectMilestonePlanningEvidence(
    options.milestone,
    createGitHubMilestonePlannerClient(),
  );
  writeLine(
    process.stdout,
    options.json ? JSON.stringify(report, null, 2) : renderMilestonePlanningEvidence(report),
  );
  return report.status === 'ready';
}

try {
  const ok = await main();
  if (!ok) process.exitCode = 1;
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
