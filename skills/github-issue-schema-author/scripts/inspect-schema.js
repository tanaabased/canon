#!/usr/bin/env bun

import { inspectGitHubIssueSchema } from '../lib/schema-inspector.js';
import { parseSchemaInspectionArgs } from '../utils/parse-schema-inspection-args.js';
import { renderSchemaInspection } from '../utils/render-schema-inspection.js';

export function usage() {
  return `Usage: bun inspect-schema.js inspect OWNER/REPO [--json]

Commands:
  inspect OWNER/REPO        Compare one explicit repository with canonical issue schema policy

Options:
  --json                    Print the complete machine-readable report
  -h, --help                Show this help

This command is read-only. It never creates, updates, migrates, or deletes GitHub state.
`;
}

/** Run the non-interactive, inspect-only schema command. */
export function runCli(argv, dependencies = {}) {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;

  let parsed;
  try {
    parsed = parseSchemaInspectionArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n\n${usage()}`);
    return 1;
  }

  if (parsed.help) {
    stdout.write(usage());
    return 0;
  }

  try {
    const report = inspectGitHubIssueSchema(parsed.target, dependencies);
    stdout.write(
      parsed.json ? `${JSON.stringify(report, null, 2)}\n` : renderSchemaInspection(report),
    );
    return 0;
  } catch (error) {
    stderr.write(`error: ${error.message}\n`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runCli(process.argv.slice(2));
