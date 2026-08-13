function findNamed(values, name) {
  return values.find((value) => value.name.toLowerCase() === name.toLowerCase());
}

/** Build a visibility-only plan for every managed organization issue field. */
export function buildFieldVisibilityPlan(inspection, currentFields, policy) {
  const blockers = [];
  if (inspection.repository.ownerType !== 'Organization') {
    blockers.push('Issue-field visibility can be synchronized only for an organization.');
  }
  const operations = [];
  for (const desired of policy.issueFields) {
    const current = findNamed(currentFields, desired.name);
    if (!current) {
      blockers.push(`${desired.name} must exist before its visibility can be synchronized.`);
      continue;
    }
    if (!Number.isInteger(Number(current.id))) {
      blockers.push(`${desired.name} does not expose a writable numeric field ID.`);
      continue;
    }
    if (current.visibility === desired.visibility) continue;
    operations.push({
      kind: 'update_issue_field_visibility',
      method: 'PATCH',
      endpoint: `/orgs/${inspection.repository.ownerLogin}/issue-fields/${current.id}`,
      field: { id: Number(current.id), name: current.name },
      before: structuredClone(current),
      body: { visibility: desired.visibility },
    });
  }
  return {
    blockers,
    plan: {
      target: inspection.target.slug,
      organization: inspection.repository.ownerLogin,
      policyVersion: inspection.policyVersion,
      operations,
      creates: [],
      updates: operations,
      deletions: [],
      preservedFields: currentFields
        .filter(
          (field) => !operations.some(({ field: changed }) => changed.id === Number(field.id)),
        )
        .map((field) => structuredClone(field)),
    },
  };
}

/** Require separate exact authorization for visibility-only field PATCHes. */
export function evaluateFieldVisibilityAuthorization(plan, digest, authorization = {}) {
  const reasons = [];
  const unsafe =
    plan.creates.length > 0 ||
    plan.deletions.length > 0 ||
    plan.operations.some(
      ({ kind, method, endpoint, field, body }) =>
        kind !== 'update_issue_field_visibility' ||
        method !== 'PATCH' ||
        endpoint !== `/orgs/${plan.organization}/issue-fields/${field.id}` ||
        JSON.stringify(Object.keys(body)) !== JSON.stringify(['visibility']),
    );
  if (unsafe) reasons.push('The schema plan contains a change beyond field visibility.');
  if (authorization.approvedOrganization !== plan.organization) {
    reasons.push(`Schema authorization must name organization ${plan.organization} exactly.`);
  }
  if (authorization.approvedDigest !== digest) {
    reasons.push('Schema authorization does not match the exact visibility plan digest.');
  }
  return { approved: reasons.length === 0, organization: plan.organization, digest, reasons };
}
