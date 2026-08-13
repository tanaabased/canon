import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };
import {
  buildFieldVisibilityPlan,
  evaluateFieldVisibilityAuthorization,
  fieldVisibilityPlanDigest,
} from '../utils/build-field-visibility-plan.js';
import { verifyFieldVisibility } from '../utils/verify-field-visibility.js';
import { GitHubIssueFieldClient } from './github-issue-field-client.js';
import { inspectGitHubIssueSchema } from './schema-inspector.js';

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
      target: inspection.target,
      organization: inspection.repository.ownerLogin,
      inspection,
      status: 'blocked',
      mutatesGitHub: false,
      blockers: [current.error],
      writes: [],
      plannedMutation: {
        target: inspection.target.slug,
        organization: inspection.repository.ownerLogin,
        operations: [],
        creates: [],
        updates: [],
        deletions: [],
      },
      authorization: { approved: false, organization: null, digest: null, reasons: [] },
      verification: null,
    };
  }
  const { blockers, plan } = buildFieldVisibilityPlan(inspection, current.value, policy);
  const digest = fieldVisibilityPlanDigest(plan);
  const approval = evaluateFieldVisibilityAuthorization(plan, digest, authorization);
  const base = {
    mode: 'synchronize_field_visibility',
    target: inspection.target,
    organization: plan.organization,
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
    };
  }

  const writes = [];
  for (const operation of plan.operations) {
    const result = client.updateIssueFieldVisibility(
      plan.organization,
      operation.field.id,
      operation.body.visibility,
    );
    writes.push(
      result.ok
        ? {
            operation: `make ${operation.field.name} ${operation.body.visibility}`,
            status: 'succeeded',
          }
        : {
            operation: `make ${operation.field.name} ${operation.body.visibility}`,
            status: 'failed',
            error: result.error,
          },
    );
    if (!result.ok) break;
  }
  const verification = verifyFieldVisibility(plan, client.listIssueFields(plan.organization));
  const complete =
    writes.length === plan.operations.length &&
    writes.every(({ status }) => status === 'succeeded') &&
    verification.status === 'verified';
  return {
    ...base,
    status: complete
      ? 'updated'
      : writes.some(({ status }) => status === 'succeeded')
        ? 'partial'
        : 'failed',
    mutatesGitHub: writes.some(({ status }) => status === 'succeeded'),
    blockers: [],
    writes,
    verification,
  };
}
