import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };
import planDigest from '../../../utils/plan-digest.js';
import {
  buildFieldPinningPlan,
  evaluateFieldPinningAuthorization,
} from '../utils/build-field-pinning-plan.js';
import { GitHubIssueFieldClient } from './github-issue-field-client.js';
import { inspectGitHubIssueSchema } from './schema-inspector.js';

/** Prepare or authorize a browser-only canonical issue-field pinning manifest. */
export function planGitHubIssueFieldPinning(
  input,
  { authorization = {}, client = new GitHubIssueFieldClient(), policy = taskManagementSchema } = {},
) {
  const inspection = inspectGitHubIssueSchema(input, { client, policy });
  const current = client.listIssueFields(inspection.repository.ownerLogin);
  if (!current.ok) {
    return {
      mode: 'synchronize_field_pinning',
      target: inspection.target,
      organization: inspection.repository.ownerLogin,
      policyVersion: inspection.policyVersion,
      inspection,
      status: 'blocked',
      mutatesGitHub: false,
      blockers: [current.error],
      plannedMutation: {
        target: inspection.target.slug,
        organization: inspection.repository.ownerLogin,
        policyVersion: inspection.policyVersion,
        executionSurface: 'github_settings_ui',
        operations: [],
        projectedIssueTypes: [],
        creates: [],
        updates: [],
        deletions: [],
      },
      authorization: { approved: false, organization: null, digest: null, reasons: [] },
      operations: [],
    };
  }

  const { blockers, plan } = buildFieldPinningPlan(inspection, current.value, policy);
  const digest = planDigest(plan);
  const approval = evaluateFieldPinningAuthorization(plan, digest, authorization);
  const base = {
    mode: 'synchronize_field_pinning',
    target: inspection.target,
    organization: plan.organization,
    policyVersion: inspection.policyVersion,
    inspection,
    plannedMutation: plan,
    authorization: approval,
    mutatesGitHub: false,
    operations: [],
  };

  if (blockers.length > 0) return { ...base, status: 'blocked', blockers };
  if (plan.operations.length === 0) return { ...base, status: 'aligned', blockers: [] };
  return {
    ...base,
    status: approval.approved ? 'ready_for_browser' : 'approval_required',
    blockers: [],
  };
}
