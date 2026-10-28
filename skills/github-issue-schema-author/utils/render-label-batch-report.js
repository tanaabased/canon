/** Render the target inventory and exact label-definition changes for batch review. */
export function renderLabelBatchReport(report) {
  const lines = [
    `GitHub Issue Schema Author: label batch (${report.mode})`,
    `status: ${report.status}`,
    `repositories: ${report.targets.join(', ') || 'none'}`,
    `creates: ${report.summary.creates}; updates: ${report.summary.updates}; aligned repositories: ${report.summary.aligned}`,
    `mutates GitHub: ${report.mutatesGitHub === null ? 'unknown' : report.mutatesGitHub ? 'yes' : 'no'}`,
  ];
  if (report.authorization) lines.push(`digest: ${report.authorization.digest}`);
  for (const skipped of report.excluded)
    lines.push(`excluded: ${skipped.repository} (${skipped.reason})`);
  for (const blocker of report.blockers) lines.push(`blocked: ${blocker}`);
  for (const plan of report.plannedMutation?.repositories ?? []) {
    lines.push(`\n${plan.target}`);
    for (const operation of plan.operations) {
      const { body, before } = operation;
      lines.push(
        before
          ? `  update ${operation.label}: #${before.color} -> #${body.color}; description: ${JSON.stringify(before.description)} -> ${JSON.stringify(body.description)}`
          : `  create ${body.name}: #${body.color}; ${body.description}`,
      );
    }
    if (!plan.operations.length) lines.push('  aligned');
    lines.push(`  preserved: ${plan.preservedLabels.map(({ name }) => name).join(', ') || 'none'}`);
  }
  for (const inspection of report.inspections ?? []) {
    const labels = inspection.labels.repository;
    lines.push(
      `${inspection.target.slug}: ${labels.status}; missing ${labels.missing.length}; drifted ${labels.drifted.length}`,
    );
  }
  for (const result of report.results ?? []) lines.push(`${result.repository}: ${result.status}`);
  if (report.mode === 'apply' && report.remaining.length)
    lines.push(`remaining: ${report.remaining.join(', ')}`);
  lines.push('renames: none; deletions: none; issue and pull-request label assignments: unchanged');
  return `${lines.join('\n')}\n`;
}
