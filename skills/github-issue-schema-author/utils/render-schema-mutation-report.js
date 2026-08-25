export default function renderSchemaMutationReport(
  report,
  {
    title,
    summaryLines = [],
    detailLines = [],
    includeWrites = false,
    includeAuthorization = false,
  },
) {
  const lines = [
    title,
    `target: ${report.target.slug}`,
    ...(report.organization ? [`organization: ${report.organization}`] : []),
    `status: ${report.status}`,
    `mutates GitHub: ${report.mutatesGitHub ? 'yes' : 'no'}`,
    ...summaryLines,
    ...detailLines,
  ];
  for (const blocker of report.blockers) lines.push(`blocker: ${blocker}`);
  if (includeWrites) {
    for (const write of report.writes) {
      lines.push(`${write.status}: ${write.operation}`);
      if (write.error) lines.push(`error: ${write.error}`);
    }
  }
  if (includeAuthorization && report.status === 'approval_required') {
    for (const reason of report.authorization.reasons) lines.push(`authorization: ${reason}`);
  }
  if (report.verification) lines.push(`verification: ${report.verification.status}`);
  return `${lines.join('\n')}\n`;
}
