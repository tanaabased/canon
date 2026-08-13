#!/usr/bin/env bun

import { authorIssueFormSet } from '../lib/issue-form-author.js';
import { parseIssueFormArgs } from '../utils/parse-issue-form-args.js';

export function usage() {
  return `Usage: bun render-issue-forms.js render --repository-mode <organization|personal> [--json]

Options:
  --repository-mode <mode>   Render organization-native or personal-fallback forms
  --json                     Print the complete machine-readable report
  -h, --help                 Show this help

This command writes no files and does not mutate GitHub.
`;
}

function renderFiles(report) {
  return report.files.map(({ path, content }) => `# ${path}\n${content}`).join('\n');
}

/** Run the non-interactive, render-only issue form command. */
export function runCli(argv, dependencies = {}) {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  let parsed;
  try {
    parsed = parseIssueFormArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n\n${usage()}`);
    return 1;
  }

  if (parsed.help) {
    stdout.write(usage());
    return 0;
  }

  const report = authorIssueFormSet(parsed.repositoryMode);
  stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : renderFiles(report));
  return 0;
}

if (import.meta.main) process.exitCode = runCli(process.argv.slice(2));
