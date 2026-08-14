function snapshot(field, visibility) {
  return {
    ...structuredClone(field),
    visibility,
  };
}

/** Verify visibility changed while every other field property stayed identical. */
export function verifyFieldVisibility(plan, result) {
  const errors = result.ok ? [] : [result.error];
  const fields = result.ok ? result.value : [];
  const checks = plan.operations.map((operation) => {
    const current = fields.find(({ id }) => Number(id) === operation.field.id);
    const expected = snapshot(operation.before, operation.body.visibility);
    const actual = current ? structuredClone(current) : null;
    return {
      key: `field:${operation.field.name}`,
      status: JSON.stringify(expected) === JSON.stringify(actual) ? 'verified' : 'drifted',
      expected,
      actual,
    };
  });
  for (const expected of plan.preservedFields) {
    const actual = fields.find(({ id }) => Number(id) === Number(expected.id)) ?? null;
    checks.push({
      key: `preserved-field:${expected.name}`,
      status: JSON.stringify(expected) === JSON.stringify(actual) ? 'verified' : 'drifted',
      expected,
      actual,
    });
  }
  return {
    status:
      errors.length === 0 && checks.every(({ status }) => status === 'verified')
        ? 'verified'
        : 'drifted',
    checks,
    mismatches: checks.filter(({ status }) => status !== 'verified'),
    errors,
  };
}
