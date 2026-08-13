import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };
import {
  buildFieldAdditionPlan,
  evaluateFieldAdditionAuthorization,
  fieldAdditionPlanDigest,
} from '../utils/build-field-addition-plan.js';
import { verifyAddedFields } from '../utils/verify-added-fields.js';
import { GitHubFieldAdditionClient } from './github-field-addition-client.js';
import { inspectGitHubIssueSchema } from './schema-inspector.js';

/** Preview or apply only missing Work size, Complexity, Impact, and Task score fields. */
export function addMissingGitHubIssueFields(
  input,
  {
    authorization = {},
    client = new GitHubFieldAdditionClient(),
    policy = taskManagementSchema,
  } = {},
) {
  const inspection = inspectGitHubIssueSchema(input, { client, policy });
  const { blockers, plan } = buildFieldAdditionPlan(inspection);
  const digest = fieldAdditionPlanDigest(plan);
  const approval = evaluateFieldAdditionAuthorization(plan, digest, authorization);
  const base = {
    mode: 'add_missing_fields',
    target: inspection.target,
    organization: plan.organization,
    policyVersion: inspection.policyVersion,
    inspection,
    plannedMutation: plan,
    authorization: approval,
    warnings: inspection.warnings,
  };

  if (blockers.length > 0) {
    return {
      ...base,
      status: 'blocked',
      mutatesGitHub: false,
      blockers,
      writes: [],
      verification: null,
      operations: [],
    };
  }
  if (plan.operations.length === 0) {
    return {
      ...base,
      status: 'aligned',
      mutatesGitHub: false,
      blockers: [],
      writes: [],
      verification: { status: 'verified', checks: [], mismatches: [], errors: [] },
      operations: [],
    };
  }
  if (!approval.approved) {
    return {
      ...base,
      status: 'approval_required',
      mutatesGitHub: false,
      blockers: [],
      writes: [],
      verification: null,
      operations: [],
    };
  }

  const writes = [];
  for (const operation of plan.operations) {
    const result = client.createIssueField(plan.organization, operation.body);
    writes.push(
      result.ok
        ? {
            operation: `create ${operation.body.name}`,
            status: 'succeeded',
            fieldId: result.value.id ?? null,
          }
        : {
            operation: `create ${operation.body.name}`,
            status: 'failed',
            error: result.error,
          },
    );
    if (!result.ok) break;
  }

  const mutated = writes.some(({ status }) => status === 'succeeded');
  let verification;
  try {
    verification = verifyAddedFields(plan, client.inspect(inspection.target).issueFields);
  } catch (error) {
    verification = {
      status: 'unavailable',
      checks: [],
      mismatches: [],
      errors: [error.message],
    };
  }
  const complete =
    writes.length === plan.operations.length &&
    writes.every(({ status }) => status === 'succeeded') &&
    verification.status === 'verified';

  return {
    ...base,
    status: complete ? 'added' : mutated ? 'partial' : 'failed',
    mutatesGitHub: mutated,
    blockers: [],
    writes,
    verification,
    operations: writes.map(({ operation }) => operation),
  };
}
