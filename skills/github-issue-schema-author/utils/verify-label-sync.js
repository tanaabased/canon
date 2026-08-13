function findNamed(values, name) {
  return values.find((value) => value.name.toLowerCase() === name.toLowerCase());
}

/** Verify canonical definitions while proving all preexisting noncanonical labels remain. */
export function verifyLabelSync(plan, inspection, policy) {
  const errors = [];
  const checks = [];
  const classified = inspection.labels.repository;
  if (classified.status === 'unresolved') {
    errors.push('Repository labels could not be re-read.');
  } else {
    const values = [
      ...(classified.aligned ?? []),
      ...(classified.drifted ?? []).map(({ current }) => current),
      ...(classified.automationOwned ?? []),
      ...(classified.legacyUnmanaged ?? []),
      ...(classified.unmanaged ?? []),
    ];
    for (const desired of policy.labels) {
      const current = findNamed(values, desired.name);
      const expected = {
        name: desired.name,
        color: desired.color.replace(/^#/, '').toLowerCase(),
        description: desired.description,
      };
      const actual = current
        ? {
            name: current.name,
            color: current.color.toLowerCase(),
            description: current.description,
          }
        : null;
      checks.push({
        key: `label:${desired.name}`,
        status: JSON.stringify(expected) === JSON.stringify(actual) ? 'verified' : 'drifted',
        expected,
        actual,
      });
    }
    for (const operation of plan.updates) {
      const current = findNamed(values, operation.label);
      checks.push({
        key: `associations:${operation.label}`,
        status:
          current?.issueCount === operation.before.issueCount &&
          current?.pullRequestCount === operation.before.pullRequestCount
            ? 'verified'
            : 'drifted',
        expected: {
          issueCount: operation.before.issueCount,
          pullRequestCount: operation.before.pullRequestCount,
        },
        actual: current
          ? { issueCount: current.issueCount, pullRequestCount: current.pullRequestCount }
          : null,
      });
    }
    for (const expected of plan.preservedLabels) {
      const current = findNamed(values, expected.name);
      const actual = current
        ? {
            name: current.name,
            color: current.color,
            description: current.description,
            issueCount: current.issueCount,
            pullRequestCount: current.pullRequestCount,
          }
        : null;
      checks.push({
        key: `preserved-label:${expected.name}`,
        status: JSON.stringify(expected) === JSON.stringify(actual) ? 'verified' : 'drifted',
        expected,
        actual,
      });
    }
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
