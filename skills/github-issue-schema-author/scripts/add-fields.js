#!/usr/bin/env bun

import { addMissingGitHubIssueFields } from '../lib/schema-field-synchronizer.js';
import { runSchemaMutationCli } from '../lib/schema-mutation-cli.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';

function usage() {
  return `Usage:
  bun add-fields.js plan OWNER/REPO [--json]
  bun add-fields.js apply OWNER/REPO --approved-organization ORG --approved-digest SHA256 [--json]

Creates only missing Work size, Complexity, and Impact organization fields.
It never updates, renames, pins, changes visibility on, or deletes existing GitHub state.
Run plan first and bind apply to its exact organization and digest.`;
}

function render(report) {
  const names = report.plannedMutation.operations.map(({ body }) => body.name);
  const lines = [
    'GitHub Issue Schema Author: additive fields',
    `target: ${report.target.slug}`,
    `organization: ${report.organization}`,
    `status: ${report.status}`,
    `mutates GitHub: ${report.mutatesGitHub ? 'yes' : 'no'}`,
    `digest: ${report.authorization.digest}`,
    `creates: ${names.length > 0 ? names.join(', ') : 'none'}`,
    'updates: none',
    'deletions: none',
  ];
  for (const blocker of report.blockers) lines.push(`blocker: ${blocker}`);
  for (const write of report.writes) {
    lines.push(`${write.status}: ${write.operation}`);
    if (write.error) lines.push(`error: ${write.error}`);
  }
  if (report.verification) lines.push(`verification: ${report.verification.status}`);
  return `${lines.join('\n')}\n`;
}

export function runFieldAdditionCli(argv, dependencies = {}) {
  return runSchemaMutationCli(argv, dependencies, {
    execute: addMissingGitHubIssueFields,
    failureStatuses: ['blocked', 'partial', 'failed'],
    parse: parseSchemaMutationArgs,
    render,
    usage,
  });
}

if (import.meta.main) process.exitCode = runFieldAdditionCli(process.argv.slice(2));
