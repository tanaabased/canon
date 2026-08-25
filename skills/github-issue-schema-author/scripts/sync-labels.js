#!/usr/bin/env bun

import { synchronizeGitHubIssueLabels } from '../lib/schema-label-synchronizer.js';
import { runSchemaMutationCli } from '../lib/schema-mutation-cli.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';
import renderSchemaMutationReport from '../utils/render-schema-mutation-report.js';

function usage() {
  return `Usage:
  bun sync-labels.js plan OWNER/REPO [--json]
  bun sync-labels.js apply OWNER/REPO --approved-repository OWNER/REPO --approved-digest SHA256 [--json]

Creates missing canonical labels and updates only canonical colors and descriptions.
It never renames or deletes labels and never changes issue or pull-request associations.`;
}

function render(report) {
  return renderSchemaMutationReport(report, {
    title: 'GitHub Issue Schema Author: canonical labels',
    summaryLines: [
      `digest: ${report.authorization.digest}`,
      `creates: ${report.plannedMutation.creates.map(({ body }) => body.name).join(', ') || 'none'}`,
      `updates: ${report.plannedMutation.updates.map(({ label }) => label).join(', ') || 'none'}`,
      'renames: none',
      'deletions: none',
    ],
  });
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
