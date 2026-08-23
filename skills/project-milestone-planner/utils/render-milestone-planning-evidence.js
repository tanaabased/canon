/**
 * Renders normalized milestone-planning evidence without writing to process streams.
 *
 * @param {object} report Milestone-planning evidence report.
 * @returns {string} Human-readable evidence summary.
 */
export default function renderMilestonePlanningEvidence(report) {
  const lines = [
    `milestone ${report.target.slug}#${report.target.number}: ${report.status.toUpperCase()}`,
    `mutates GitHub: ${report.mutatesGitHub}`,
  ];

  if (report.milestone) {
    lines.push(
      '',
      report.milestone.title || '(untitled milestone)',
      `state: ${report.milestone.state || 'unknown'}`,
      `due: ${report.milestone.dueOn || 'unset'}`,
    );
    if (report.milestone.description) lines.push(report.milestone.description);
  }

  lines.push(
    '',
    `member tasks: ${report.memberTasks.length}`,
    `candidate tasks: ${report.candidateTasks.length}`,
    `member pull requests: ${report.memberPullRequests.length}`,
    `delivered work: ${report.deliveredWork.length}`,
  );

  if (report.warnings.length > 0) {
    lines.push('', 'Warnings:', ...report.warnings.map((warning) => `- ${warning}`));
  }
  if (report.errors.length > 0) {
    lines.push('', 'Evidence errors:', ...report.errors.map((error) => `- ${error}`));
  }
  return lines.join('\n');
}
