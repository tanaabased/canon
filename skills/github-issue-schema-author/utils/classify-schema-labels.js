import findNamed from './find-named.js';

function labelWithUse(label, classification) {
  return {
    ...label,
    classification,
    associationCount: (label.issueCount ?? 0) + (label.pullRequestCount ?? 0),
  };
}

/** Compare canonical labels and classify every remaining repository label without deleting anything. */
export function classifySchemaLabels(policy, observedLabels) {
  if (observedLabels.status !== 'ok') {
    return {
      status: observedLabels.status === 'unavailable' ? 'unresolved' : observedLabels.status,
      aligned: [],
      missing: [],
      drifted: [],
      automationOwned: [],
      legacyUnmanaged: [],
      unmanaged: [],
      projectSpecificCandidates: [],
      unresolved:
        observedLabels.status === 'unavailable'
          ? [
              {
                path: 'repositoryLabels',
                reason: observedLabels.reason ?? 'Labels could not be inspected.',
              },
            ]
          : [],
    };
  }

  const aligned = [];
  const missing = [];
  const drifted = [];
  for (const desired of policy.labels) {
    const current = findNamed(observedLabels.values, desired.name);
    if (!current) {
      missing.push({ path: `labels.${desired.name}`, current: null, desired });
      continue;
    }

    const differences = [];
    if (current.name !== desired.name) {
      differences.push({ property: 'name', current: current.name, desired: desired.name });
    }
    if (current.color.toLowerCase().replace(/^#/, '') !== desired.color.toLowerCase()) {
      differences.push({ property: 'color', current: current.color, desired: desired.color });
    }
    if ((current.description ?? '') !== desired.description) {
      differences.push({
        property: 'description',
        current: current.description ?? '',
        desired: desired.description,
      });
    }

    if (differences.length > 0) {
      drifted.push({
        path: `labels.${desired.name}`,
        current: labelWithUse(current, 'canonical'),
        desired,
        differences,
      });
    } else {
      aligned.push(labelWithUse(current, 'canonical'));
    }
  }

  const canonicalNames = new Set(policy.labels.map(({ name }) => name.toLowerCase()));
  const automationNames = new Set(policy.automationOwnedLabels.map((name) => name.toLowerCase()));
  const legacyNames = new Set(policy.legacyUnmanagedLabels.map((name) => name.toLowerCase()));
  const remaining = observedLabels.values.filter(
    ({ name }) => !canonicalNames.has(name.toLowerCase()),
  );
  const automationOwned = remaining
    .filter(({ name }) => automationNames.has(name.toLowerCase()))
    .map((label) => labelWithUse(label, 'automation_owned'));
  const legacyUnmanaged = remaining
    .filter(({ name }) => legacyNames.has(name.toLowerCase()))
    .map((label) => labelWithUse(label, 'legacy_unmanaged'));
  const unmanaged = remaining
    .filter(
      ({ name }) =>
        !automationNames.has(name.toLowerCase()) && !legacyNames.has(name.toLowerCase()),
    )
    .map((label) => labelWithUse(label, 'unmanaged'));

  return {
    status: drifted.length > 0 ? 'drifted' : missing.length > 0 ? 'missing' : 'aligned',
    aligned,
    missing,
    drifted,
    automationOwned,
    legacyUnmanaged,
    unmanaged,
    projectSpecificCandidates: unmanaged,
    projectSpecificLimit: policy.projectSpecificLabelLimit,
    projectSpecificLimitExceeded: Math.max(0, unmanaged.length - policy.projectSpecificLabelLimit),
    unresolved: [],
    deletionPlan: [],
  };
}
