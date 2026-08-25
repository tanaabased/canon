import {
  observedIssueFieldValue,
  observedIssueTypeName,
  observedLabelNames,
} from '../../task-author/lib/task-observation.js';

/** Verify that an existing issue is an exact reusable child without rejecting unmanaged extras. */
export default function verifyReusableChild(plan, { issue, fields = [], comments = [] }) {
  const errors = [];
  if (issue?.title !== plan.issue.title) errors.push('title differs from the proposed child.');
  if (issue?.body !== plan.issue.body) errors.push('body differs from the proposed child.');

  const observedLabels = new Set(
    observedLabelNames(issue?.labels).map((label) => label.toLowerCase()),
  );
  for (const expected of plan.expected.labels) {
    if (!observedLabels.has(expected.toLowerCase())) errors.push(`label ${expected} is missing.`);
  }
  if (
    plan.expected.type &&
    observedIssueTypeName(issue)?.toLowerCase() !== plan.expected.type.toLowerCase()
  ) {
    errors.push(`issue type differs from ${plan.expected.type}.`);
  }
  for (const expected of plan.expected.fields) {
    const observed = fields.find(
      (field) => Number(field.issue_field_id ?? field.field_id ?? field.id) === expected.id,
    );
    const expectedValue = String(expected.value).toLowerCase();
    const rawValue = observedIssueFieldValue(observed);
    const actualValue = String(rawValue?.name ?? rawValue ?? null).toLowerCase();
    if (expectedValue !== actualValue) errors.push(`field ${expected.name} differs.`);
  }

  const commentBodies = new Set(comments.map(({ body }) => body));
  const missingComments = plan.comments.filter(({ body }) => !commentBodies.has(body));
  return { errors, missingComments, status: errors.length === 0 ? 'reusable' : 'drifted' };
}
