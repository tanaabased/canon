#!/usr/bin/env bun

import { synchronizeGitHubIssueFieldVisibility } from '../lib/schema-field-synchronizer.js';
import { runSchemaMutationCli } from '../lib/schema-mutation-cli.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';
import renderSchemaMutationReport from '../utils/render-schema-mutation-report.js';

function usage() {
  return `Usage:
  bun set-field-visibility.js plan OWNER/REPO [--json]
  bun set-field-visibility.js apply OWNER/REPO --approved-organization ORG --approved-digest SHA256 [--json]

Synchronizes only canonical managed-field visibility. Field identity, descriptions,
types, options, pinning, values, labels, unmanaged fields, and deletions remain unchanged.`;
}

function render(report) {
  return renderSchemaMutationReport(report, {
    title: 'GitHub Issue Schema Author: field visibility',
    summaryLines: [
      `digest: ${report.authorization.digest}`,
      `updates: ${report.plannedMutation.operations.map(({ field }) => field.name).join(', ') || 'none'}`,
      'creates: none',
      'deletions: none',
    ],
  });
}

export function runFieldVisibilityCli(argv, dependencies = {}) {
  return runSchemaMutationCli(argv, dependencies, {
    execute: synchronizeGitHubIssueFieldVisibility,
    failureStatuses: ['blocked', 'partial', 'failed'],
    parse: parseSchemaMutationArgs,
    render,
    runtimeErrorWithUsage: true,
    usage,
  });
}

if (import.meta.main) process.exitCode = runFieldVisibilityCli(process.argv.slice(2));
