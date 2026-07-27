function renderCriterion(criterion) {
  return `- [${criterion.complete ? 'x' : ' '}] ${criterion.text}`;
}

function renderPullRequest(pullRequest) {
  const lines = [
    `- ${pullRequest.slug}#${pullRequest.number}: ${pullRequest.outcome}`,
    `  ${pullRequest.title || pullRequest.url}`,
  ];
  if (pullRequest.blockers.length > 0) lines.push(`  Blocked: ${pullRequest.blockers.join('; ')}`);
  if (pullRequest.waiting.length > 0) lines.push(`  Pending: ${pullRequest.waiting.join('; ')}`);
  for (const failure of pullRequest.failureDetails ?? []) {
    lines.push(`  Failing check: ${failure.name || 'unknown'}`);
    if (failure.detailsUrl) lines.push(`  Details: ${failure.detailsUrl}`);
    if (failure.logSnippet) {
      lines.push(
        '  Failure snippet:',
        ...failure.logSnippet.split('\n').map((line) => `    ${line}`),
      );
    } else if (failure.note || failure.error) {
      lines.push(`  Log: ${failure.note || failure.error}`);
    }
  }
  return lines;
}

/**
 * Renders a Task completion assessment without writing to process streams.
 *
 * @param {object} report Normalized Task completion report.
 * @returns {string} Human-readable assessment.
 */
export default function renderTaskCompletion(report) {
  const lines = [
    `Task ${report.target.slug}#${report.target.number}: ${report.status.toUpperCase()}`,
  ];
  if (report.task?.title) lines.push(report.task.title);
  lines.push('', `Reason: ${report.reason}`);

  lines.push('', `Acceptance criteria (${report.criteria.length}):`);
  if (report.criteria.length === 0) lines.push('- none found');
  else lines.push(...report.criteria.map(renderCriterion));

  lines.push('', `Pull request evidence (${report.pullRequests.length}):`);
  if (report.pullRequests.length === 0) lines.push('- none');
  else {
    for (const pullRequest of report.pullRequests) lines.push(...renderPullRequest(pullRequest));
  }

  if (report.task?.comments?.length > 0) {
    lines.push('', `Task comments inspected: ${report.task.comments.length}`);
  }
  if (report.errors.length > 0) {
    lines.push('', 'Evidence errors:', ...report.errors.map((error) => `- ${error}`));
  }

  return lines.join('\n');
}
