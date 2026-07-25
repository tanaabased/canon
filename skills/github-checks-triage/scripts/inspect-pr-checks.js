#!/usr/bin/env bun

import { bold, dim, fail, renderCliHelp, writeLine } from '../../../lib/bun-cli-support.js';
import { createGitHubChecksClient } from '../lib/github-checks-client.js';
import { inspectPrChecks } from '../lib/pr-checks-inspector.js';
import parseInspectPrChecksArgs, {
  DEFAULT_CONTEXT_LINES,
  DEFAULT_MAX_LINES,
} from '../utils/parse-inspect-pr-checks-args.js';
import renderPrCheckResults from '../utils/render-pr-check-results.js';

function renderUsage(stream = process.stdout) {
  return renderCliHelp(
    {
      usage: `Usage: ${bold('inspect-pr-checks.js', stream)} ${dim('[options]', stream)}`,
      summary:
        'Inspect failing GitHub PR checks, fetch GitHub Actions logs, and extract a failure snippet.',
      options: [
        `  --repo <path>           path inside the target Git repository ${dim('[default: .]', stream)}`,
        '  --pr <value>            PR number or URL; defaults to the current branch PR',
        `  --max-lines <count>     maximum snippet or tail size ${dim(`[default: ${DEFAULT_MAX_LINES}]`, stream)}`,
        `  --context <count>       lines of context around the failure marker ${dim(`[default: ${DEFAULT_CONTEXT_LINES}]`, stream)}`,
        '  --json                  emit JSON instead of text output',
        '  -h, --help              show this message',
      ],
    },
    stream,
  );
}

async function main() {
  const options = parseInspectPrChecksArgs(process.argv.slice(2));
  if (options.help) {
    writeLine(process.stdout, renderUsage());
    return true;
  }

  const inspection = inspectPrChecks(options, createGitHubChecksClient());
  if (options.json) {
    writeLine(process.stdout, JSON.stringify(inspection, null, 2));
  } else if (inspection.results.length === 0) {
    writeLine(process.stdout, `PR #${inspection.pr}: no failing checks detected.`);
  } else {
    writeLine(process.stdout, renderPrCheckResults(inspection.pr, inspection.results));
  }

  return inspection.results.length === 0;
}

try {
  const ok = await main();
  if (!ok) process.exitCode = 1;
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
