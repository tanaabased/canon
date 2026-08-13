#!/usr/bin/env bun

import { planGitHubIssueFieldPinning } from '../lib/schema-field-pinning-planner.js';
import { parseFieldPinningArgs } from '../utils/parse-field-pinning-args.js';

function usage() {
  return `Usage:
  bun pin-fields.js plan OWNER/REPO [--json]
  bun pin-fields.js authorize OWNER/REPO --approved-organization ORG --approved-digest SHA256 [--json]

Prepares and authorizes an exact GitHub Settings UI manifest for canonical field pinning.
This command never writes to GitHub and never calls GitHub's private web endpoint.`;
}

function render(report) {
  const lines = [
    'GitHub Issue Schema Author: field pinning',
    `target: ${report.target.slug}`,
    `organization: ${report.organization}`,
    `status: ${report.status}`,
    'mutates GitHub: no',
    `execution surface: ${report.plannedMutation.executionSurface}`,
    `digest: ${report.authorization.digest}`,
    'creates: none',
    `updates: ${report.plannedMutation.operations.length}`,
    'deletions: none',
  ];
  for (const operation of report.plannedMutation.operations) {
    lines.push(
      `${operation.field.name}: ${operation.before.pinnedIssueTypes.join(', ') || 'none'} -> ${operation.after.pinnedIssueTypes.map(({ name }) => name).join(', ')}`,
    );
    lines.push(`url: ${operation.url}`);
  }
  for (const blocker of report.blockers) lines.push(`blocker: ${blocker}`);
  if (report.status === 'approval_required') {
    for (const reason of report.authorization.reasons) lines.push(`authorization: ${reason}`);
  }
  return `${lines.join('\n')}\n`;
}

export function runFieldPinningCli(argv, dependencies = {}) {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  let parsed;
  try {
    parsed = parseFieldPinningArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n\n${usage()}\n`);
    return 1;
  }
  if (parsed.help) {
    stdout.write(`${usage()}\n`);
    return 0;
  }

  try {
    const report = planGitHubIssueFieldPinning(parsed.target, {
      ...dependencies,
      authorization: parsed.authorization,
    });
    stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : render(report));
    return report.status === 'blocked' ? 1 : 0;
  } catch (error) {
    stderr.write(`error: ${error.message}\n`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runFieldPinningCli(process.argv.slice(2));
