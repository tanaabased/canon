function displayValue(value) {
  return value === null ? '<missing>' : JSON.stringify(value);
}

/**
 * Renders a stable human-readable policy report.
 *
 * @param {object} report Repository policy report.
 * @returns {string} Newline-terminated report.
 */
export default function renderRepositoryPolicyReport(report) {
  const lines = [`target: ${report.target}`, `status: ${report.status}`];

  if (report.operation) {
    lines.push(`operation: ${report.operation}`);
  }
  if (report.branch_action) {
    const action = report.branch_action;
    const detail = action.from ? ` (${action.from} -> ${action.to})` : '';
    lines.push(`branch action: ${action.type}${detail}`);
  }
  if (report.applied?.length > 0) {
    lines.push('applied:');
    for (const step of report.applied) {
      lines.push(`- ${step}`);
    }
  }

  lines.push('changes:');
  if (report.changes.length === 0) {
    lines.push('- none');
  } else {
    for (const change of report.changes) {
      const current = displayValue(change.current);
      const desired = displayValue(change.desired);
      lines.push(`- ${change.path}: ${current} -> ${desired}`);
    }
  }

  return `${lines.join('\n')}\n`;
}
