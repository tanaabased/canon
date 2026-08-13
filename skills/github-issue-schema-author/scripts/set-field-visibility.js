#!/usr/bin/env bun

import { synchronizeGitHubIssueFieldVisibility } from '../lib/schema-field-visibility-synchronizer.js';
import { parseFieldMutationArgs } from '../utils/parse-field-mutation-args.js';

function usage() {
  return `Usage:
  bun set-field-visibility.js plan OWNER/REPO [--json]
  bun set-field-visibility.js apply OWNER/REPO --approved-organization ORG --approved-digest SHA256 [--json]

Synchronizes only canonical managed-field visibility. Field identity, descriptions,
types, options, pinning, values, labels, unmanaged fields, and deletions remain unchanged.`;
}

function render(report) {
  const lines = [
    'GitHub Issue Schema Author: field visibility',
    `target: ${report.target.slug}`,
    `organization: ${report.organization}`,
    `status: ${report.status}`,
    `mutates GitHub: ${report.mutatesGitHub ? 'yes' : 'no'}`,
    `digest: ${report.authorization.digest}`,
    `updates: ${report.plannedMutation.operations.map(({ field }) => field.name).join(', ') || 'none'}`,
    'creates: none',
    'deletions: none',
  ];
  for (const blocker of report.blockers) lines.push(`blocker: ${blocker}`);
  if (report.verification) lines.push(`verification: ${report.verification.status}`);
  return `${lines.join('\n')}\n`;
}

export function runFieldVisibilityCli(argv, dependencies = {}) {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  try {
    const parsed = parseFieldMutationArgs(argv);
    if (parsed.help) {
      stdout.write(`${usage()}\n`);
      return 0;
    }
    const report = synchronizeGitHubIssueFieldVisibility(parsed.target, {
      ...dependencies,
      authorization: parsed.authorization,
    });
    stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : render(report));
    return ['blocked', 'partial', 'failed'].includes(report.status) ? 1 : 0;
  } catch (error) {
    stderr.write(`${error.message}\n\n${usage()}\n`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runFieldVisibilityCli(process.argv.slice(2));
