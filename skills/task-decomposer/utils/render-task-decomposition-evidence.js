/** Render a concise evidence summary while preserving full detail in JSON mode. */
export default function renderTaskDecompositionEvidence(report) {
  const lines = [
    `task ${report.target.slug}#${report.target.issueNumber}: ${report.status.toUpperCase()}`,
    `mutates GitHub: ${report.mutatesGitHub}`,
  ];
  if (report.issue) {
    lines.push(
      '',
      report.issue.title || '(untitled task)',
      `state: ${report.issue.state || 'unknown'}`,
      `work size: ${report.metadata.workSize.value ?? 'unset'} (${report.metadata.workSize.source})`,
      `acceptance criteria: ${report.acceptanceCriteria.length}`,
      `sub-issues: ${report.subIssues.length}`,
      `blocked by: ${report.dependencies.blockedBy.length}`,
      `blocking: ${report.dependencies.blocking.length}`,
      `linked delivery evidence: ${report.linkedWork.length}`,
    );
  }
  if (report.warnings.length > 0) {
    lines.push('', 'Warnings:', ...report.warnings.map((warning) => `- ${warning}`));
  }
  if (report.errors.length > 0) {
    lines.push('', 'Evidence errors:', ...report.errors.map((error) => `- ${error}`));
  }
  return lines.join('\n');
}
