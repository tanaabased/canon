import { createHash } from 'node:crypto';

import { desiredOptionColor } from './desired-option-color.js';

const COLOR_FIELD_NAMES = Object.freeze(['Work size', 'Complexity', 'Impact']);

function findNamed(values, name) {
  return values.find((value) => value.name.toLowerCase() === name.toLowerCase());
}

function optionIdentity(option) {
  return {
    id: option.id,
    name: option.name,
    description: option.description,
    priority: option.priority,
  };
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Build a color-only field update plan that retains every existing option identity. */
export function buildFieldColorPlan(inspection, currentFields, policy) {
  const blockers = [];
  if (inspection.repository.ownerType !== 'Organization') {
    blockers.push('Issue-field colors can be synchronized only for an organization.');
  }

  const operations = [];
  for (const name of COLOR_FIELD_NAMES) {
    const desired = findNamed(policy.issueFields, name);
    const current = findNamed(currentFields, name);
    if (!desired || !current) {
      blockers.push(`${name} must exist before its option colors can be synchronized.`);
      continue;
    }
    if (current.dataType !== 'single_select') {
      blockers.push(`${name} is not a single-select field.`);
      continue;
    }

    const currentNames = current.options.map(({ name: optionName }) => optionName);
    if (!same(currentNames, desired.options)) {
      blockers.push(`${name} options or order differ from the canonical schema.`);
      continue;
    }
    if (
      current.options.some(
        ({ id, priority }) => !Number.isInteger(id) || !Number.isInteger(priority),
      )
    ) {
      blockers.push(`${name} option IDs or priorities are unavailable.`);
      continue;
    }

    const nextOptions = current.options.map((option) => ({
      id: option.id,
      name: option.name,
      description: option.description,
      color: desiredOptionColor(desired, option.name),
      priority: option.priority,
    }));
    if (same(current.options, nextOptions)) continue;

    const field = {
      id: current.id,
      name: current.name,
      description: current.description,
      dataType: current.dataType,
      visibility: current.visibility,
    };
    operations.push({
      kind: 'update_issue_field_option_colors',
      method: 'PATCH',
      endpoint: `/orgs/${inspection.repository.ownerLogin}/issue-fields/${current.id}`,
      field,
      before: { field, options: current.options },
      body: { options: nextOptions },
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
    },
  };
}

/** Bind field-color authorization to the complete preservation-safe update plan. */
export function fieldColorPlanDigest(plan) {
  return `sha256:${createHash('sha256').update(JSON.stringify(plan)).digest('hex')}`;
}

/** Require exact organization and digest authorization and reject non-color option changes. */
export function evaluateFieldColorAuthorization(plan, digest, authorization = {}) {
  const reasons = [];
  const unsafe =
    plan.creates.length > 0 ||
    plan.deletions.length > 0 ||
    plan.operations.some((operation) => {
      const bodyKeys = Object.keys(operation.body).sort();
      const beforeIdentity = operation.before.options.map(optionIdentity);
      const nextIdentity = operation.body.options.map(optionIdentity);
      return (
        operation.kind !== 'update_issue_field_option_colors' ||
        operation.method !== 'PATCH' ||
        operation.endpoint !== `/orgs/${plan.organization}/issue-fields/${operation.field.id}` ||
        !same(bodyKeys, ['options']) ||
        !same(beforeIdentity, nextIdentity)
      );
    });
  if (unsafe) reasons.push('The schema plan contains a change beyond retained option colors.');
  if (authorization.approvedOrganization !== plan.organization) {
    reasons.push(`Schema authorization must name organization ${plan.organization} exactly.`);
  }
  if (authorization.approvedDigest !== digest) {
    reasons.push('Schema authorization does not match the exact field-color plan digest.');
  }
  return {
    approved: reasons.length === 0,
    organization: plan.organization,
    digest,
    reasons,
  };
}
