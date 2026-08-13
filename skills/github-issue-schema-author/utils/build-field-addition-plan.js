import { createHash } from 'node:crypto';

const ADDITIVE_FIELD_NAMES = Object.freeze(['Work size', 'Complexity', 'Impact', 'Task score']);

function fieldPayload(desired) {
  const payload = {
    name: desired.name,
    description: desired.description ?? '',
    data_type: desired.dataType,
    visibility: desired.visibility,
  };
  if (desired.options) {
    payload.options = desired.options.map((name, index) => ({
      name,
      description: '',
      color: 'gray',
      priority: index + 1,
    }));
  }
  return payload;
}

/** Build an additive-only organization issue-field plan from a fresh Schema Author report. */
export function buildFieldAdditionPlan(inspection) {
  const blockers = [];
  if (inspection.repository.ownerType !== 'Organization') {
    blockers.push('Issue fields can be added only to an organization-owned repository.');
  }
  if (inspection.issueFields.unresolved.some(({ path }) => path === 'issueFields')) {
    blockers.push('Organization issue fields could not be inspected; absence is not proven.');
  }

  const allowed = new Set(ADDITIVE_FIELD_NAMES.map((name) => name.toLowerCase()));
  const operations = inspection.issueFields.missing
    .filter(({ desired }) => allowed.has(desired.name.toLowerCase()))
    .map(({ desired }) => ({
      kind: 'create_issue_field',
      method: 'POST',
      endpoint: `/orgs/${inspection.repository.ownerLogin}/issue-fields`,
      body: fieldPayload(desired),
    }));

  const plan = {
    target: inspection.target.slug,
    organization: inspection.repository.ownerLogin,
    policyVersion: inspection.policyVersion,
    operations,
    updates: [],
    deletions: [],
  };
  return { blockers, plan };
}

/** Bind organization-field authorization to the exact additive mutation plan. */
export function fieldAdditionPlanDigest(plan) {
  return `sha256:${createHash('sha256').update(JSON.stringify(plan)).digest('hex')}`;
}

/** Require exact organization and plan authorization and reject any non-additive operation. */
export function evaluateFieldAdditionAuthorization(plan, digest, authorization = {}) {
  const reasons = [];
  const unsafe =
    plan.updates.length > 0 ||
    plan.deletions.length > 0 ||
    plan.operations.some(
      ({ kind, method, endpoint }) =>
        kind !== 'create_issue_field' ||
        method !== 'POST' ||
        endpoint !== `/orgs/${plan.organization}/issue-fields`,
    );
  if (unsafe) reasons.push('The schema plan contains a non-additive operation.');
  if (authorization.approvedOrganization !== plan.organization) {
    reasons.push(`Schema authorization must name organization ${plan.organization} exactly.`);
  }
  if (authorization.approvedDigest !== digest) {
    reasons.push('Schema authorization does not match the exact field-addition plan digest.');
  }
  return {
    approved: reasons.length === 0,
    organization: plan.organization,
    digest,
    reasons,
  };
}
