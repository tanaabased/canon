import {
  observedIssueFieldValue,
  observedIssueTypeName,
  observedLabelNames,
} from '../lib/task-observation.js';

function check(key, expected, actual) {
  return {
    key,
    status: JSON.stringify(actual) === JSON.stringify(expected) ? 'verified' : 'drifted',
    expected,
    actual,
  };
}

/** Compare every Task Author-managed value with the freshly re-read GitHub state. */
export function verifyCreatedTask(plan, { issue, fields = [], comments = [] } = {}) {
  const checks = [
    check('title', plan.issue.title, issue?.title ?? null),
    check('body', plan.issue.body, issue?.body ?? null),
    check(
      'labels',
      [...plan.expected.labels].map((label) => label.toLowerCase()).sort(),
      observedLabelNames(issue?.labels)
        .map((label) => label.toLowerCase())
        .sort(),
    ),
  ];

  if (plan.expected.type) {
    checks.push(
      check(
        'type',
        plan.expected.type.toLowerCase(),
        observedIssueTypeName(issue)?.toLowerCase() ?? null,
      ),
    );
  }

  for (const expected of plan.expected.fields) {
    const observed = fields.find(
      (field) => Number(field.issue_field_id ?? field.field_id ?? field.id) === expected.id,
    );
    const actual = observedIssueFieldValue(observed);
    const normalizedExpected =
      expected.type === 'single_select' ? String(expected.value).toLowerCase() : expected.value;
    const normalizedActual =
      expected.type === 'single_select' && actual !== undefined && actual !== null
        ? String(actual).toLowerCase()
        : (actual ?? null);
    checks.push(check(`field:${expected.name}`, normalizedExpected, normalizedActual));
  }

  const observedComments = new Set(comments.map(({ body }) => body));
  for (const expected of plan.comments) {
    checks.push(
      check(
        `comment:${expected.kind}`,
        expected.body,
        observedComments.has(expected.body) ? expected.body : null,
      ),
    );
  }

  return {
    status: checks.every(({ status }) => status === 'verified') ? 'verified' : 'drifted',
    checks,
    mismatches: checks.filter(({ status }) => status !== 'verified'),
  };
}
