#!/usr/bin/env bun

import { planGitHubIssueFieldPinning } from '../lib/schema-field-pinning-planner.js';
import { runSchemaMutationCli } from '../lib/schema-mutation-cli.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';
import renderSchemaMutationReport from '../utils/render-schema-mutation-report.js';

function usage() {
  return `Usage:
  bun pin-fields.js plan OWNER/REPO [--json]
  bun pin-fields.js authorize OWNER/REPO --approved-organization ORG --approved-digest SHA256 [--json]

Prepares and authorizes an exact GitHub Settings UI manifest for canonical field pinning.
This command never writes to GitHub and never calls GitHub's private web endpoint.`;
}

function render(report) {
  const detailLines = report.plannedMutation.operations.flatMap((operation) => [
    `${operation.field.name}: ${operation.before.pinnedIssueTypes.join(', ') || 'none'} -> ${operation.after.pinnedIssueTypes.map(({ name }) => name).join(', ')}`,
    `url: ${operation.url}`,
  ]);
  return renderSchemaMutationReport(report, {
    title: 'GitHub Issue Schema Author: field pinning',
    summaryLines: [
      `execution surface: ${report.plannedMutation.executionSurface}`,
      `digest: ${report.authorization.digest}`,
      'creates: none',
      `updates: ${report.plannedMutation.operations.length}`,
      'deletions: none',
    ],
    detailLines,
    includeAuthorization: true,
  });
}

export function runFieldPinningCli(argv, dependencies = {}) {
  return runSchemaMutationCli(argv, dependencies, {
    execute: planGitHubIssueFieldPinning,
    failureStatuses: ['blocked'],
    parse: (args) => parseSchemaMutationArgs(args, { mutationCommand: 'authorize' }),
    render,
    usage,
  });
}

if (import.meta.main) process.exitCode = runFieldPinningCli(process.argv.slice(2));
