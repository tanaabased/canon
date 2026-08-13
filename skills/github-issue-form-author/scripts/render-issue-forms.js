#!/usr/bin/env bun

import { authorIssueFormSet } from '../lib/issue-form-author.js';
import { alignGitHubIssueForms } from '../lib/issue-form-repository-author.js';
import { parseIssueFormArgs } from '../utils/parse-issue-form-args.js';

export function usage() {
  return `Usage:
  bun render-issue-forms.js render --repository-mode <organization|personal> [--json]
  bun render-issue-forms.js plan OWNER/REPO [--json]
  bun render-issue-forms.js apply OWNER/REPO --approved-repository OWNER/REPO --approved-branch BRANCH --approved-digest SHA256 [--json]

Options:
  --repository-mode <mode>   Render organization-native or personal-fallback forms
  --approved-repository      Bind apply to the exact repository
  --approved-branch          Bind apply to the inspected default branch
  --approved-digest          Bind apply to the exact four-file mutation plan
  --json                     Print the complete machine-readable report
  -h, --help                 Show this help

Render and plan are read-only. Apply writes only task.yml, bug.yml, feature.yml, and config.yml,
never deletes files, and verifies the resulting repository state.
`;
}

function renderFiles(report) {
  return report.files.map(({ path, content }) => `# ${path}\n${content}`).join('\n');
}

function renderRepositoryReport(report) {
  const creates = report.plannedMutation.operations
    .filter(({ kind }) => kind === 'create_file')
    .map(({ path }) => path);
  const updates = report.plannedMutation.operations
    .filter(({ kind }) => kind === 'update_file')
    .map(({ path }) => path);
  const lines = [
    'GitHub Issue Form Author: repository alignment',
    `target: ${report.target.slug}`,
    `repository mode: ${report.repositoryMode}`,
    `branch: ${report.branch}`,
    `status: ${report.status}`,
    `mutates GitHub: ${report.mutatesGitHub ? 'yes' : 'no'}`,
    `digest: ${report.authorization.digest}`,
    `creates: ${creates.length > 0 ? creates.join(', ') : 'none'}`,
    `updates: ${updates.length > 0 ? updates.join(', ') : 'none'}`,
    'deletions: none',
  ];
  for (const file of report.plannedMutation.unmanagedFiles) {
    lines.push(`unmanaged preserved: ${file.path}`);
  }
  for (const blocker of report.blockers) lines.push(`blocker: ${blocker}`);
  for (const write of report.writes) {
    lines.push(`${write.status}: ${write.operation}`);
    if (write.error) lines.push(`error: ${write.error}`);
  }
  if (report.verification) lines.push(`verification: ${report.verification.status}`);
  return `${lines.join('\n')}\n`;
}

/** Run the non-interactive render and repository-alignment command. */
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

  try {
    if (parsed.command === 'render') {
      const report = authorIssueFormSet(parsed.repositoryMode);
      stdout.write(parsed.json ? `${JSON.stringify(report, null, 2)}\n` : renderFiles(report));
      return 0;
    }
    const report = alignGitHubIssueForms(parsed.target, {
      ...dependencies,
      authorization: parsed.authorization,
    });
    stdout.write(
      parsed.json ? `${JSON.stringify(report, null, 2)}\n` : renderRepositoryReport(report),
    );
    return ['blocked', 'partial', 'failed'].includes(report.status) ? 1 : 0;
  } catch (error) {
    stderr.write(`error: ${error.message}\n`);
    return 1;
  }
}

if (import.meta.main) process.exitCode = runCli(process.argv.slice(2));
