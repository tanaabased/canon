#!/usr/bin/env bun

import { synchronizeGitHubIssueLabels } from '../lib/schema-label-synchronizer.js';
import { runSchemaMutationCli } from '../lib/schema-mutation-cli.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';

function usage() {
  return `Usage:
  bun sync-labels.js plan OWNER/REPO [--json]
  bun sync-labels.js apply OWNER/REPO --approved-repository OWNER/REPO --approved-digest SHA256 [--json]

Creates missing canonical labels and updates only canonical colors and descriptions.
It never renames or deletes labels and never changes issue or pull-request associations.`;
}

function render(report) {
  const lines = [
    'GitHub Issue Schema Author: canonical labels',
    `target: ${report.target.slug}`,
    `status: ${report.status}`,
    `mutates GitHub: ${report.mutatesGitHub ? 'yes' : 'no'}`,
    `digest: ${report.authorization.digest}`,
    `creates: ${report.plannedMutation.creates.map(({ body }) => body.name).join(', ') || 'none'}`,
    `updates: ${report.plannedMutation.updates.map(({ label }) => label).join(', ') || 'none'}`,
    'renames: none',
    'deletions: none',
  ];
  for (const blocker of report.blockers) lines.push(`blocker: ${blocker}`);
  if (report.verification) lines.push(`verification: ${report.verification.status}`);
  return `${lines.join('\n')}\n`;
}

export function runLabelSyncCli(argv, dependencies = {}) {
  return runSchemaMutationCli(argv, dependencies, {
    execute: synchronizeGitHubIssueLabels,
    failureStatuses: ['blocked', 'partial', 'failed'],
    parse: (args) =>
      parseSchemaMutationArgs(args, {
        approvalFlag: '--approved-repository',
        approvalKey: 'approvedRepository',
        expectedCommandSuffix: '.',
      }),
    render,
    runtimeErrorWithUsage: true,
    usage,
  });
}

if (import.meta.main) process.exitCode = runLabelSyncCli(process.argv.slice(2));
