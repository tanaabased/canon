#!/usr/bin/env bun

import { synchronizeGitHubLabelBatch } from '../lib/schema-label-batch-synchronizer.js';
import { runSchemaMutationCli } from '../lib/schema-mutation-cli.js';
import { parseLabelBatchArgs } from '../utils/parse-label-batch-args.js';
import { renderLabelBatchReport } from '../utils/render-label-batch-report.js';

function usage() {
  return `Usage:
  bun sync-labels-batch.js inspect|plan --organization ORG [--repository OWNER/REPO ...] [--json]
  bun sync-labels-batch.js apply --organization ORG [--repository OWNER/REPO ...] --approved-digest SHA256 [--json]

--organization is optional when explicit --repository targets are supplied.
inspect and plan are read-only. Organization discovery includes all accessible pages,
excludes archived/disabled repositories, and deduplicates explicit targets.
Apply requires the reviewed digest for the exact inventory and label changes.
Only canonical labels are created or definition-updated. Other labels, assignments,
issue fields, and organization defaults are preserved. Partial failures stop the batch.`;
}

export function runLabelBatchCli(argv, dependencies = {}) {
  return runSchemaMutationCli(argv, dependencies, {
    execute: synchronizeGitHubLabelBatch,
    failureStatuses: ['unresolved', 'blocked', 'stale', 'partial', 'failed'],
    parse: parseLabelBatchArgs,
    render: renderLabelBatchReport,
    usage,
  });
}

if (import.meta.main) process.exitCode = runLabelBatchCli(process.argv.slice(2));
