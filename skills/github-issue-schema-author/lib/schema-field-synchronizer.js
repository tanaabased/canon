import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };
import planDigest from '../../../utils/plan-digest.js';
import {
  buildFieldAdditionPlan,
  evaluateFieldAdditionAuthorization,
} from '../utils/build-field-addition-plan.js';
import {
  buildFieldColorPlan,
  evaluateFieldColorAuthorization,
} from '../utils/build-field-color-plan.js';
import {
  buildFieldVisibilityPlan,
  evaluateFieldVisibilityAuthorization,
} from '../utils/build-field-visibility-plan.js';
import { verifyAddedFields } from '../utils/verify-added-fields.js';
import { verifyFieldColors } from '../utils/verify-field-colors.js';
import { verifyFieldVisibility } from '../utils/verify-field-visibility.js';
import { GitHubIssueFieldClient } from './github-issue-field-client.js';
import { inspectGitHubIssueSchema } from './schema-inspector.js';

const EMPTY_VERIFICATION = Object.freeze({
  status: 'verified',
  checks: [],
  mismatches: [],
  errors: [],
});

function withOperations(report, operations, includeOperations) {
  return includeOperations ? { ...report, operations } : report;
}

function finishFieldMutation({
  approval,
  apply,
  base,
  blockers,
  client,
  includeOperations,
  plan,
  successStatus,
  verify,
}) {
  if (blockers.length > 0) {
    return withOperations(
      {
        ...base,
        status: 'blocked',
        mutatesGitHub: false,
        blockers,
        writes: [],
        verification: null,
      },
      [],
      includeOperations,
    );
  }
  if (plan.operations.length === 0) {
    return withOperations(
      {
        ...base,
        status: 'aligned',
        mutatesGitHub: false,
        blockers: [],
        writes: [],
        verification: EMPTY_VERIFICATION,
      },
      [],
      includeOperations,
    );
  }
  if (!approval.approved) {
    return withOperations(
      {
        ...base,
        status: 'approval_required',
        mutatesGitHub: false,
        blockers: [],
        writes: [],
        verification: null,
      },
      [],
      includeOperations,
    );
  }

  const writes = [];
  for (const operation of plan.operations) {
    const { result, summary, success = {} } = apply(client, plan, operation);
    writes.push(
      result.ok
        ? { operation: summary, status: 'succeeded', ...success }
        : { operation: summary, status: 'failed', error: result.error },
    );
    if (!result.ok) break;
  }

  const mutated = writes.some(({ status }) => status === 'succeeded');
  const verification = verify(client, plan);
  const complete =
    writes.length === plan.operations.length &&
    writes.every(({ status }) => status === 'succeeded') &&
    verification.status === 'verified';
  return withOperations(
    {
      ...base,
      status: complete ? successStatus : mutated ? 'partial' : 'failed',
      mutatesGitHub: mutated,
      blockers: [],
      writes,
      verification,
    },
    writes.map(({ operation }) => operation),
    includeOperations,
  );
}

function unavailableFieldListReport(inspection, error, { includeOperations, policyVersion }) {
  const plan = {
    target: inspection.target.slug,
    organization: inspection.repository.ownerLogin,
    ...(policyVersion ? { policyVersion: inspection.policyVersion } : {}),
    operations: [],
    creates: [],
    updates: [],
    deletions: [],
  };
  return withOperations(
    {
      target: inspection.target,
      organization: inspection.repository.ownerLogin,
      ...(policyVersion ? { policyVersion: inspection.policyVersion } : {}),
      inspection,
      status: 'blocked',
      mutatesGitHub: false,
      blockers: [error],
      writes: [],
      plannedMutation: plan,
      authorization: { approved: false, organization: null, digest: null, reasons: [] },
      verification: null,
    },
    [],
    includeOperations,
  );
}

/** Preview or apply only missing Work size, Complexity, and Impact fields. */
export function addMissingGitHubIssueFields(
  input,
  { authorization = {}, client = new GitHubIssueFieldClient(), policy = taskManagementSchema } = {},
) {
  const inspection = inspectGitHubIssueSchema(input, { client, policy });
  const { blockers, plan } = buildFieldAdditionPlan(inspection);
  const approval = evaluateFieldAdditionAuthorization(plan, planDigest(plan), authorization);
  return finishFieldMutation({
    approval,
    blockers,
    client,
    plan,
    includeOperations: true,
    successStatus: 'added',
    base: {
      mode: 'add_missing_fields',
      target: inspection.target,
      organization: plan.organization,
      policyVersion: inspection.policyVersion,
      inspection,
      plannedMutation: plan,
      authorization: approval,
      warnings: inspection.warnings,
    },
    apply: (fieldClient, fieldPlan, operation) => {
      const result = fieldClient.createIssueField(fieldPlan.organization, operation.body);
      return {
        result,
        summary: `create ${operation.body.name}`,
        success: { fieldId: result.ok ? (result.value.id ?? null) : null },
      };
    },
    verify: (fieldClient, fieldPlan) => {
      try {
        return verifyAddedFields(fieldPlan, fieldClient.inspect(inspection.target).issueFields);
      } catch (error) {
        return { status: 'unavailable', checks: [], mismatches: [], errors: [error.message] };
      }
    },
  });
}

/** Preview or apply only canonical colors while retaining every existing select option. */
export function synchronizeGitHubIssueFieldColors(
  input,
  { authorization = {}, client = new GitHubIssueFieldClient(), policy = taskManagementSchema } = {},
) {
  const inspection = inspectGitHubIssueSchema(input, { client, policy });
  const current = client.listIssueFields(inspection.repository.ownerLogin);
  if (!current.ok) {
    return {
      mode: 'synchronize_field_colors',
      ...unavailableFieldListReport(inspection, current.error, {
        includeOperations: true,
        policyVersion: true,
      }),
    };
  }
  const { blockers, plan } = buildFieldColorPlan(inspection, current.value, policy);
  const approval = evaluateFieldColorAuthorization(plan, planDigest(plan), authorization);
  return finishFieldMutation({
    approval,
    blockers,
    client,
    plan,
    includeOperations: true,
    successStatus: 'updated',
    base: {
      mode: 'synchronize_field_colors',
      target: inspection.target,
      organization: plan.organization,
      policyVersion: inspection.policyVersion,
      inspection,
      plannedMutation: plan,
      authorization: approval,
    },
    apply: (fieldClient, fieldPlan, operation) => ({
      result: fieldClient.recolorIssueField(
        fieldPlan.organization,
        operation.field.id,
        operation.body.options,
      ),
      summary: `recolor ${operation.field.name}`,
    }),
    verify: (fieldClient, fieldPlan) =>
      verifyFieldColors(fieldPlan, fieldClient.listIssueFields(fieldPlan.organization)),
  });
}

/** Preview or apply the separately authorized canonical visibility projection. */
export function synchronizeGitHubIssueFieldVisibility(
  input,
  { authorization = {}, client = new GitHubIssueFieldClient(), policy = taskManagementSchema } = {},
) {
  const inspection = inspectGitHubIssueSchema(input, { client, policy });
  const current = client.listIssueFields(inspection.repository.ownerLogin);
  if (!current.ok) {
    return {
      mode: 'synchronize_field_visibility',
      ...unavailableFieldListReport(inspection, current.error, {
        includeOperations: false,
        policyVersion: false,
      }),
    };
  }
  const { blockers, plan } = buildFieldVisibilityPlan(inspection, current.value, policy);
  const approval = evaluateFieldVisibilityAuthorization(plan, planDigest(plan), authorization);
  return finishFieldMutation({
    approval,
    blockers,
    client,
    plan,
    includeOperations: false,
    successStatus: 'updated',
    base: {
      mode: 'synchronize_field_visibility',
      target: inspection.target,
      organization: plan.organization,
      inspection,
      plannedMutation: plan,
      authorization: approval,
    },
    apply: (fieldClient, fieldPlan, operation) => ({
      result: fieldClient.updateIssueFieldVisibility(
        fieldPlan.organization,
        operation.field.id,
        operation.body.visibility,
      ),
      summary: `make ${operation.field.name} ${operation.body.visibility}`,
    }),
    verify: (fieldClient, fieldPlan) =>
      verifyFieldVisibility(fieldPlan, fieldClient.listIssueFields(fieldPlan.organization)),
  });
}
