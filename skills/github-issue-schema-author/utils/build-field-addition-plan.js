import { desiredOptionColor } from './desired-option-color.js';
import findNamed from './find-named.js';

const ADDITIVE_FIELD_NAMES = new Set(['work size', 'complexity', 'impact']);

function fieldPayload(desired, visibility) {
  const payload = {
    name: desired.name,
    description: desired.description ?? '',
    data_type: desired.dataType,
    visibility,
  };
  if (desired.options) {
    payload.options = desired.options.map((name, index) => ({
      name,
      description: '',
      color: desiredOptionColor(desired, name),
      priority: index + 1,
    }));
  }
  return payload;
}

function additionEndpoint(plan) {
  return Object.hasOwn(plan, 'account')
    ? '/user/issue-fields'
    : `/orgs/${plan.organization}/issue-fields`;
}

/** Build an additive plan from the selected owner's observed field definitions. */
export function buildFieldAdditionPlan(inspection, { personalInventory, policy } = {}) {
  const blockers = [];
  const { ownerType, ownerLogin } = inspection.repository;
  const personal = ownerType === 'User';
  if (personal && !personalInventory?.ok) {
    blockers.push(personalInventory?.error ?? 'Personal issue fields could not be inspected.');
  }
  if (!personal && ownerType !== 'Organization') {
    blockers.push(
      'Issue field additions require a verified organization or personal repository owner.',
    );
  }
  if (!personal && inspection.issueFields.unresolved.some(({ path }) => path === 'issueFields')) {
    blockers.push('Organization issue fields could not be inspected; absence is not proven.');
  }

  const owner = personal
    ? {
        account: personalInventory?.account?.login ?? ownerLogin,
        accountId: personalInventory?.account?.id ?? null,
      }
    : { organization: ownerLogin };
  const fields = personal
    ? policy.issueFields
    : inspection.issueFields.missing.map(({ desired }) => desired);
  const expected = fields
    .filter(({ name }) => ADDITIVE_FIELD_NAMES.has(name.toLowerCase()))
    .map((desired) => ({
      kind: 'create_issue_field',
      method: 'POST',
      endpoint: additionEndpoint(owner),
      body: fieldPayload(desired, personal ? 'restricted' : desired.visibility),
    }));
  const operations = personal
    ? expected.filter(
        ({ body }) => personalInventory?.ok && !findNamed(personalInventory.value, body.name),
      )
    : expected;

  const plan = {
    target: inspection.target.slug,
    ...owner,
    policyVersion: inspection.policyVersion,
    operations,
    updates: [],
    deletions: [],
  };
  return { blockers, plan, expected };
}

/** Require approval of the exact owner and plan for additive operations. */
export function evaluateFieldAdditionAuthorization(plan, digest, authorization = {}) {
  const reasons = [];
  const personal = Object.hasOwn(plan, 'account');
  const owner = personal ? plan.account : plan.organization;
  const approvedOwner = personal
    ? authorization.approvedAccount
    : authorization.approvedOrganization;
  const unsafe =
    plan.updates.length > 0 ||
    plan.deletions.length > 0 ||
    plan.operations.some(
      ({ kind, method, endpoint }) =>
        kind !== 'create_issue_field' || method !== 'POST' || endpoint !== additionEndpoint(plan),
    );
  if (unsafe) reasons.push('The schema plan contains a non-additive operation.');
  if (approvedOwner !== owner) {
    reasons.push(
      `Schema authorization must name ${personal ? 'account' : 'organization'} ${owner} exactly.`,
    );
  }
  if (!digest || authorization.approvedDigest !== digest) {
    reasons.push('Schema authorization does not match the exact field-addition plan digest.');
  }
  return {
    approved: reasons.length === 0,
    ...(personal ? { account: owner } : { organization: owner }),
    digest,
    reasons,
  };
}
