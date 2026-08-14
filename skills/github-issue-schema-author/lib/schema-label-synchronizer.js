import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };
import planDigest from '../../../utils/plan-digest.js';
import {
  buildLabelSyncPlan,
  evaluateLabelSyncAuthorization,
} from '../utils/build-label-sync-plan.js';
import { verifyLabelSync } from '../utils/verify-label-sync.js';
import { GitHubLabelClient } from './github-label-client.js';
import { inspectGitHubIssueSchema } from './schema-inspector.js';

/** Synchronize canonical repository label definitions without changing associations. */
export function synchronizeGitHubIssueLabels(
  input,
  { authorization = {}, client = new GitHubLabelClient(), policy = taskManagementSchema } = {},
) {
  const inspection = inspectGitHubIssueSchema(input, { client, policy });
  const { blockers, plan } = buildLabelSyncPlan(inspection, policy);
  const digest = planDigest(plan);
  const approval = evaluateLabelSyncAuthorization(plan, digest, authorization);
  const base = {
    mode: 'synchronize_labels',
    target: inspection.target,
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
    const result =
      operation.method === 'POST'
        ? client.createLabel(inspection.target, operation.body)
        : client.updateLabel(inspection.target, operation.label, operation.body);
    writes.push(
      result.ok
        ? {
            operation: `${operation.method === 'POST' ? 'create' : 'update'} label ${operation.body.name ?? operation.label}`,
            status: 'succeeded',
          }
        : {
            operation: `${operation.method === 'POST' ? 'create' : 'update'} label ${operation.body.name ?? operation.label}`,
            status: 'failed',
            error: result.error,
          },
    );
    if (!result.ok) break;
  }
  const fresh = inspectGitHubIssueSchema(input, { client, policy });
  const verification = verifyLabelSync(plan, fresh, policy);
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
