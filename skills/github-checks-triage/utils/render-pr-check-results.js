function indentBlock(text, prefix = '  ') {
  return String(text)
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

/**
 * Renders inspected failing checks without writing to a process stream.
 *
 * @param {string} prNumber Pull request number.
 * @param {object[]} results Normalized check analyses.
 * @returns {string} Human-readable report.
 */
export default function renderPrCheckResults(prNumber, results) {
  const lines = [`PR #${prNumber}: ${results.length} failing checks analyzed.`];

  for (const result of results) {
    lines.push('-'.repeat(60), `Check: ${result.name || ''}`);
    if (result.detailsUrl) lines.push(`Details: ${result.detailsUrl}`);
    if (result.runId) lines.push(`Run ID: ${result.runId}`);
    if (result.jobId) lines.push(`Job ID: ${result.jobId}`);
    lines.push(`Status: ${result.status || 'unknown'}`);

    const run = result.run || {};
    if (Object.keys(run).length > 0) {
      const workflow = run.workflowName || run.name || '';
      const conclusion = run.conclusion || run.status || '';
      lines.push(`Workflow: ${workflow} (${conclusion})`);
      const branch = run.headBranch || '';
      const sha = String(run.headSha || '').slice(0, 12);
      if (branch || sha) lines.push(`Branch/SHA: ${branch} ${sha}`.trimEnd());
      if (run.url) lines.push(`Run URL: ${run.url}`);
    }

    if (result.note) lines.push(`Note: ${result.note}`);
    if (result.error) {
      lines.push(`Error fetching logs: ${result.error}`);
      continue;
    }
    if (result.logSnippet) {
      lines.push('Failure snippet:', indentBlock(result.logSnippet));
    } else {
      lines.push('No snippet available.');
    }
  }

  lines.push('-'.repeat(60));
  return lines.join('\n');
}
