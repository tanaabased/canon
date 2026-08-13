function optionShape(options) {
  return options.map(({ id, name, description, color, priority }) => ({
    id,
    name,
    description,
    color: String(color).toLowerCase(),
    priority,
  }));
}

/** Verify colors plus every field and option property that the color update must preserve. */
export function verifyFieldColors(plan, observed) {
  if (!observed.ok) {
    return {
      status: 'unavailable',
      checks: [],
      mismatches: [],
      errors: [observed.error],
    };
  }

  const checks = plan.operations.map((operation) => {
    const current = observed.value.find(({ id }) => id === operation.field.id);
    const expected = {
      ...operation.field,
      options: optionShape(operation.body.options),
    };
    const actual = current
      ? {
          id: current.id,
          name: current.name,
          description: current.description,
          dataType: current.dataType,
          visibility: current.visibility,
          options: optionShape(current.options),
        }
      : null;
    return {
      field: operation.field.name,
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
