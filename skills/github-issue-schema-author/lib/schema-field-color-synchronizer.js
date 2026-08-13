import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };
import {
  buildFieldColorPlan,
  evaluateFieldColorAuthorization,
  fieldColorPlanDigest,
} from '../utils/build-field-color-plan.js';
import { verifyFieldColors } from '../utils/verify-field-colors.js';
import { GitHubIssueFieldClient } from './github-issue-field-client.js';
import { inspectGitHubIssueSchema } from './schema-inspector.js';

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
      target: inspection.target,
      organization: inspection.repository.ownerLogin,
      policyVersion: inspection.policyVersion,
      inspection,
      status: 'blocked',
      mutatesGitHub: false,
      blockers: [current.error],
      writes: [],
      plannedMutation: {
        target: inspection.target.slug,
        organization: inspection.repository.ownerLogin,
        policyVersion: inspection.policyVersion,
        operations: [],
        creates: [],
        updates: [],
        deletions: [],
      },
      authorization: { approved: false, organization: null, digest: null, reasons: [] },
      verification: null,
      operations: [],
    };
  }

  const { blockers, plan } = buildFieldColorPlan(inspection, current.value, policy);
  const digest = fieldColorPlanDigest(plan);
  const approval = evaluateFieldColorAuthorization(plan, digest, authorization);
  const base = {
    mode: 'synchronize_field_colors',
    target: inspection.target,
    organization: plan.organization,
    policyVersion: inspection.policyVersion,
    inspection,
    plannedMutation: plan,
    authorization: approval,
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
    const result = client.recolorIssueField(
      plan.organization,
      operation.field.id,
      operation.body.options,
    );
    writes.push(
      result.ok
        ? { operation: `recolor ${operation.field.name}`, status: 'succeeded' }
        : {
            operation: `recolor ${operation.field.name}`,
            status: 'failed',
            error: result.error,
          },
    );
    if (!result.ok) break;
  }

  const mutated = writes.some(({ status }) => status === 'succeeded');
  const verification = verifyFieldColors(plan, client.listIssueFields(plan.organization));
  const complete =
    writes.length === plan.operations.length &&
    writes.every(({ status }) => status === 'succeeded') &&
    verification.status === 'verified';

  return {
    ...base,
    status: complete ? 'updated' : mutated ? 'partial' : 'failed',
    mutatesGitHub: mutated,
    blockers: [],
    writes,
    verification,
    operations: writes.map(({ operation }) => operation),
  };
}
