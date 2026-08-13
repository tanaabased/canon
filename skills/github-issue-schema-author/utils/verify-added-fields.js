function normalizeType(value) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('-', '_');
}

function normalizeVisibility(value) {
  const normalized = String(value ?? '').toLowerCase();
  if (['org_only', 'organization_only', 'organization_members_only'].includes(normalized)) {
    return 'organization_members_only';
  }
  return normalized;
}

function optionShape(options = []) {
  return options.map(({ name, color = 'gray', description = '' }) => ({
    name,
    color: String(color).toLowerCase(),
    description: description ?? '',
  }));
}

/** Verify every created field against a fresh normalized organization-field read. */
export function verifyAddedFields(plan, observedFields) {
  if (observedFields.status !== 'ok') {
    return {
      status: 'unavailable',
      checks: [],
      mismatches: [],
      errors: [observedFields.reason ?? 'Organization issue fields could not be re-read.'],
    };
  }

  const checks = plan.operations.map(({ body }) => {
    const current = observedFields.values.find(
      ({ name }) => name.toLowerCase() === body.name.toLowerCase(),
    );
    const expected = {
      name: body.name,
      description: body.description,
      dataType: normalizeType(body.data_type),
      visibility: normalizeVisibility(body.visibility),
      options: optionShape(body.options),
    };
    const actual = current
      ? {
          name: current.name,
          description: current.description ?? '',
          dataType: normalizeType(current.dataType),
          visibility: normalizeVisibility(current.visibility),
          options: optionShape(current.options),
        }
      : null;
    return {
      field: body.name,
      status: JSON.stringify(actual) === JSON.stringify(expected) ? 'verified' : 'drifted',
      expected,
      actual,
    };
  });

  return {
    status: checks.every(({ status }) => status === 'verified') ? 'verified' : 'drifted',
    checks,
    mismatches: checks.filter(({ status }) => status !== 'verified'),
    errors: [],
  };
}
