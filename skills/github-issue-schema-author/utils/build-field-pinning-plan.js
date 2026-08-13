import { createHash } from 'node:crypto';

const MAX_PINNED_FIELDS_PER_TYPE = 10;

function findNamed(values, name) {
  return values.find((value) => value.name.toLowerCase() === name.toLowerCase());
}

function sameSet(left, right) {
  return (
    left.length === right.length &&
    [...left].sort().every((value, index) => value === [...right].sort()[index])
  );
}

function fieldRecord(inspection, name) {
  return [...inspection.issueFields.drifted, ...inspection.issueFields.migrationRequired].find(
    ({ desired }) => desired.name.toLowerCase() === name.toLowerCase(),
  );
}

function pinDifference(record) {
  return record?.differences.find(({ property }) => property === 'pinnedIssueTypes');
}

function projectedPinning(pinning, desiredFields) {
  return pinning.values.map((issueType) => {
    const fields = new Set(issueType.pinnedFields.map(({ name }) => name));
    for (const field of desiredFields) {
      if (field.pinnedIssueTypes.includes(issueType.name)) fields.add(field.name);
      else fields.delete(field.name);
    }
    return { name: issueType.name, fieldNames: [...fields], count: fields.size };
  });
}

/** Build an exact browser execution manifest for canonical managed-field pinning. */
export function buildFieldPinningPlan(inspection, restFields, policy) {
  const blockers = [];
  if (inspection.repository.ownerType !== 'Organization') {
    blockers.push('Issue fields can be pinned only for an organization.');
  }
  if (inspection.pinning.organization.status !== 'ok') {
    blockers.push('Organization issue-field pinning could not be inspected.');
  }
  if (
    inspection.issueTypes.organization.status !== 'aligned' ||
    inspection.issueTypes.repository.status !== 'aligned'
  ) {
    blockers.push('Task, Bug, and Feature must be enabled before fields can be pinned.');
  }
  if (inspection.issueFields.missing.length > 0) {
    blockers.push('Every managed field must exist before pinning can be synchronized.');
  }
  if (inspection.issueFields.migrationRequired.length > 0) {
    blockers.push('Managed field migrations must be resolved before pinning can be synchronized.');
  }
  if (inspection.issueFields.unresolved.length > 0) {
    blockers.push('Managed field pinning is unresolved and cannot be synchronized safely.');
  }

  const typeIds = new Map(
    inspection.issueTypes.organization.aligned.map(({ id, name }) => [name, id]),
  );
  const operations = [];
  for (const desired of policy.issueFields) {
    const record = fieldRecord(inspection, desired.name);
    const difference = pinDifference(record);
    if (!difference) continue;

    const restField = findNamed(restFields, desired.name);
    if (!restField || !Number.isInteger(restField.id)) {
      blockers.push(`${desired.name} does not have a numeric field ID for the GitHub settings UI.`);
      continue;
    }
    const desiredTypes = desired.pinnedIssueTypes.map((name) => ({ name, id: typeIds.get(name) }));
    if (desiredTypes.some(({ id }) => !id)) {
      blockers.push(`${desired.name} references an issue type without a resolvable ID.`);
      continue;
    }
    operations.push({
      kind: 'replace_issue_field_pins',
      surface: 'github_settings_ui',
      field: {
        id: restField.id,
        nodeId: record.id,
        name: desired.name,
      },
      url: `https://github.com/organizations/${inspection.repository.ownerLogin}/settings/issue-fields/${restField.id}`,
      before: { pinnedIssueTypes: difference.current },
      after: { pinnedIssueTypes: desiredTypes, pinToNoTypeIssues: false },
      preserves: [
        'field identity',
        'name',
        'description',
        'data type',
        'visibility',
        'options',
        'values',
        'unmanaged fields',
      ],
    });
  }

  const projected =
    inspection.pinning.organization.status === 'ok'
      ? projectedPinning(inspection.pinning.organization, policy.issueFields)
      : [];
  for (const issueType of projected) {
    if (issueType.count > MAX_PINNED_FIELDS_PER_TYPE) {
      blockers.push(
        `${issueType.name} would have ${issueType.count} pinned fields; GitHub allows ${MAX_PINNED_FIELDS_PER_TYPE}.`,
      );
    }
  }

  return {
    blockers,
    plan: {
      target: inspection.target.slug,
      organization: inspection.repository.ownerLogin,
      policyVersion: inspection.policyVersion,
      executionSurface: 'github_settings_ui',
      operations,
      projectedIssueTypes: projected,
      creates: [],
      updates: operations,
      deletions: [],
    },
  };
}

export function fieldPinningPlanDigest(plan) {
  return `sha256:${createHash('sha256').update(JSON.stringify(plan)).digest('hex')}`;
}

/** Bind browser execution authorization to the complete organization and pin set. */
export function evaluateFieldPinningAuthorization(plan, digest, authorization = {}) {
  const reasons = [];
  const unsafe =
    plan.executionSurface !== 'github_settings_ui' ||
    plan.creates.length > 0 ||
    plan.deletions.length > 0 ||
    plan.operations.some((operation) => {
      const desiredNames = operation.after.pinnedIssueTypes.map(({ name }) => name);
      return (
        operation.kind !== 'replace_issue_field_pins' ||
        operation.surface !== 'github_settings_ui' ||
        !operation.url.startsWith(
          `https://github.com/organizations/${plan.organization}/settings/issue-fields/`,
        ) ||
        operation.after.pinToNoTypeIssues !== false ||
        !sameSet(desiredNames, ['Task', 'Bug', 'Feature'])
      );
    });
  if (unsafe) reasons.push('The schema plan contains a change beyond canonical field pinning.');
  if (authorization.approvedOrganization !== plan.organization) {
    reasons.push(`Schema authorization must name organization ${plan.organization} exactly.`);
  }
  if (authorization.approvedDigest !== digest) {
    reasons.push('Schema authorization does not match the exact field-pinning plan digest.');
  }
  return {
    approved: reasons.length === 0,
    organization: plan.organization,
    digest,
    reasons,
  };
}
