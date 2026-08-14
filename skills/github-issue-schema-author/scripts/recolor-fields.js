#!/usr/bin/env bun

import { synchronizeGitHubIssueFieldColors } from '../lib/schema-field-synchronizer.js';
import { runSchemaMutationCli } from '../lib/schema-mutation-cli.js';
import { parseSchemaMutationArgs } from '../utils/parse-schema-mutation-args.js';

function usage() {
  return `Usage:
  bun recolor-fields.js plan OWNER/REPO [--json]
  bun recolor-fields.js apply OWNER/REPO --approved-organization ORG --approved-digest SHA256 [--json]

Synchronizes only canonical colors on Work size, Complexity, and Impact options.
Every option ID, name, description, and priority is retained. Field identity, description,
type, visibility, pinning, values, labels, and all deletions remain out of scope.`;
}

function colorChanges(operation) {
  return operation.body.options
    .map((option, index) => ({
      name: option.name,
      before: operation.before.options[index].color,
      after: option.color,
    }))
    .filter(({ before, after }) => before !== after)
    .map(({ name, before, after }) => `${name} ${before}->${after}`)
    .join(', ');
}

function render(report) {
  const names = report.plannedMutation.operations.map(({ field }) => field.name);
  const lines = [
    'GitHub Issue Schema Author: field colors',
    `target: ${report.target.slug}`,
    `organization: ${report.organization}`,
    `status: ${report.status}`,
    `mutates GitHub: ${report.mutatesGitHub ? 'yes' : 'no'}`,
    `digest: ${report.authorization.digest}`,
    'creates: none',
    `updates: ${names.length > 0 ? names.join(', ') : 'none'}`,
    'deletions: none',
  ];
  for (const operation of report.plannedMutation.operations) {
    lines.push(`${operation.field.name}: ${colorChanges(operation)}`);
  }
  for (const blocker of report.blockers) lines.push(`blocker: ${blocker}`);
  for (const write of report.writes) {
    lines.push(`${write.status}: ${write.operation}`);
    if (write.error) lines.push(`error: ${write.error}`);
  }
  if (report.verification) lines.push(`verification: ${report.verification.status}`);
  return `${lines.join('\n')}\n`;
}

export function runFieldColorCli(argv, dependencies = {}) {
  return runSchemaMutationCli(argv, dependencies, {
    execute: synchronizeGitHubIssueFieldColors,
    failureStatuses: ['blocked', 'partial', 'failed'],
    parse: parseSchemaMutationArgs,
    render,
    usage,
  });
}

if (import.meta.main) process.exitCode = runFieldColorCli(process.argv.slice(2));
