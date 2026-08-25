import findNamed from './find-named.js';

/** Build a canonical repository-label create/update plan without renames or deletions. */
export function buildLabelSyncPlan(inspection, policy) {
  const blockers = [];
  const classified = inspection.labels.repository;
  if (classified.status === 'unresolved') {
    blockers.push('Repository labels could not be inspected; absence and drift are not proven.');
  }
  const observed = [
    ...(classified.aligned ?? []),
    ...(classified.drifted ?? []).map(({ current }) => current),
    ...(classified.automationOwned ?? []),
    ...(classified.legacyUnmanaged ?? []),
    ...(classified.unmanaged ?? []),
  ];
  const canonicalNames = new Set(policy.labels.map(({ name }) => name.toLowerCase()));
  const preservedLabels = observed
    .filter(({ name }) => !canonicalNames.has(name.toLowerCase()))
    .map(({ name, color, description, issueCount, pullRequestCount }) => ({
      name,
      color,
      description,
      issueCount,
      pullRequestCount,
    }));
  const operations = [];
  for (const desired of policy.labels) {
    const current = findNamed(observed, desired.name);
    if (!current) {
      operations.push({
        kind: 'create_repository_label',
        method: 'POST',
        endpoint: `/repos/${inspection.target.slug}/labels`,
        body: {
          name: desired.name,
          color: desired.color.replace(/^#/, ''),
          description: desired.description,
        },
      });
      continue;
    }
    if (current.name !== desired.name) {
      blockers.push(
        `Canonical label ${desired.name} has casing drift and requires a separately authorized rename.`,
      );
      continue;
    }
    const next = {
      color: desired.color.replace(/^#/, ''),
      description: desired.description,
    };
    if (
      current.color.toLowerCase() === next.color.toLowerCase() &&
      current.description === next.description
    ) {
      continue;
    }
    operations.push({
      kind: 'update_repository_label_definition',
      method: 'PATCH',
      endpoint: `/repos/${inspection.target.slug}/labels/${encodeURIComponent(current.name)}`,
      label: current.name,
      before: {
        name: current.name,
        color: current.color,
        description: current.description,
        issueCount: current.issueCount,
        pullRequestCount: current.pullRequestCount,
      },
      body: next,
    });
  }
  return {
    blockers,
    plan: {
      target: inspection.target.slug,
      policyVersion: inspection.policyVersion,
      operations,
      creates: operations.filter(({ method }) => method === 'POST'),
      updates: operations.filter(({ method }) => method === 'PATCH'),
      renames: [],
      deletions: [],
      preservedLabels,
    },
  };
}

/** Require exact repository and digest authorization for definition-only label sync. */
export function evaluateLabelSyncAuthorization(plan, digest, authorization = {}) {
  const reasons = [];
  const unsafe =
    plan.renames.length > 0 ||
    plan.deletions.length > 0 ||
    plan.operations.some(({ kind, method, body }) => {
      const keys = Object.keys(body).sort();
      return method === 'POST'
        ? kind !== 'create_repository_label' ||
            JSON.stringify(keys) !== JSON.stringify(['color', 'description', 'name'])
        : kind !== 'update_repository_label_definition' ||
            method !== 'PATCH' ||
            JSON.stringify(keys) !== JSON.stringify(['color', 'description']);
    });
  if (unsafe) reasons.push('The label plan contains an association, rename, or deletion change.');
  if (authorization.approvedRepository !== plan.target) {
    reasons.push(`Label authorization must name repository ${plan.target} exactly.`);
  }
  if (authorization.approvedDigest !== digest) {
    reasons.push('Label authorization does not match the exact synchronization plan digest.');
  }
  return { approved: reasons.length === 0, repository: plan.target, digest, reasons };
}
