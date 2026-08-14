function lineList(title, values) {
  if (values.length === 0) return [];
  return [title, ...values.map((value) => `  - ${value.path ?? value.name ?? value}`)];
}

/** Render a concise human-readable companion to the complete JSON inspection report. */
export function renderSchemaInspection(report) {
  const lines = [
    'GitHub Issue Schema Author',
    `target: ${report.target.slug}`,
    `status: ${report.status}`,
    'mutates GitHub: no',
    `organization issue types: ${report.issueTypes.organization.status}`,
    `repository issue types: ${report.issueTypes.repository.status}`,
    `issue fields: ${report.issueFields.status}`,
    `repository labels: ${report.labels.repository.status}`,
    `organization default labels: ${report.labels.organizationDefaults.status}`,
  ];

  lines.push(
    ...lineList('missing:', [
      ...report.issueTypes.organization.missing,
      ...report.issueTypes.repository.missing,
      ...report.issueFields.missing,
      ...report.labels.repository.missing,
    ]),
    ...lineList('drifted:', [
      ...report.issueTypes.organization.drifted,
      ...report.issueTypes.repository.drifted,
      ...report.issueFields.drifted,
      ...report.labels.repository.drifted,
    ]),
    ...lineList('migration required:', report.issueFields.migrationRequired),
    ...lineList(
      'preserved unmanaged fields:',
      report.issueFields.unmanaged.filter(
        ({ classification }) => classification === 'preserved_unmanaged',
      ),
    ),
  );

  for (const warning of report.warnings) lines.push(`warning: ${warning}`);
  return `${lines.join('\n')}\n`;
}
