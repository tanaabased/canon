import findNamed from './find-named.js';

function compareSurface(desiredTypes, observed) {
  if (observed.status !== 'ok') {
    return {
      status: observed.status === 'unavailable' ? 'unresolved' : observed.status,
      aligned: [],
      missing: [],
      drifted: [],
      unmanaged: [],
      unresolved:
        observed.status === 'unavailable'
          ? [
              {
                path: 'issueTypes',
                reason: observed.reason ?? 'Issue types could not be inspected.',
              },
            ]
          : [],
    };
  }

  const aligned = [];
  const missing = [];
  const drifted = [];
  for (const desired of desiredTypes) {
    const current = findNamed(observed.values, desired.name);
    if (!current) {
      missing.push({ path: `issueTypes.${desired.name}`, desired, current: null });
    } else if (current.enabled === false) {
      drifted.push({
        path: `issueTypes.${desired.name}.enabled`,
        desired: true,
        current: false,
      });
    } else {
      aligned.push({ name: desired.name, id: current.id ?? null });
    }
  }

  const desiredNames = new Set(desiredTypes.map(({ name }) => name.toLowerCase()));
  const unmanaged = observed.values.filter(({ name }) => !desiredNames.has(name.toLowerCase()));
  return {
    status: drifted.length > 0 ? 'drifted' : missing.length > 0 ? 'missing' : 'aligned',
    aligned,
    missing,
    drifted,
    unmanaged,
    unresolved: [],
  };
}

/** Compare organization definitions and repository-effective issue type availability. */
export function compareIssueTypes(desiredTypes, organizationTypes, repositoryTypes) {
  return {
    organization: compareSurface(desiredTypes, organizationTypes),
    repository: compareSurface(desiredTypes, repositoryTypes),
  };
}
