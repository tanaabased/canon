import {
  buildIssueFormRepositoryPlan,
  evaluateIssueFormRepositoryAuthorization,
} from '../utils/build-issue-form-repository-plan.js';
import planDigest from '../../../utils/plan-digest.js';
import { parseRepositoryTarget } from '../utils/parse-repository-target.js';
import { GitHubIssueFormClient } from './github-issue-form-client.js';
import { authorIssueFormSet } from './issue-form-author.js';

function repositoryMode(ownerType) {
  if (ownerType === 'Organization') return 'organization';
  if (ownerType === 'User') return 'personal';
  return null;
}

function verifyAlignment(client, target, expectedMode) {
  try {
    const inspection = client.inspectRepository(target);
    const mode = repositoryMode(inspection.ownerType);
    if (mode !== expectedMode) {
      return {
        status: 'unavailable',
        checks: [],
        mismatches: [],
        errors: [`Repository mode changed from ${expectedMode} to ${mode ?? 'unknown'}.`],
      };
    }
    const { blockers, plan } = buildIssueFormRepositoryPlan(inspection, authorIssueFormSet(mode));
    return {
      status: blockers.length === 0 && plan.operations.length === 0 ? 'verified' : 'drifted',
      checks: plan.operations.length === 0 ? ['all four managed files align'] : [],
      mismatches: plan.operations.map(({ path, kind }) => ({ path, kind })),
      errors: blockers,
    };
  } catch (error) {
    return { status: 'unavailable', checks: [], mismatches: [], errors: [error.message] };
  }
}

/** Inspect, preview, or digest-authorize exact repository-local issue-form alignment. */
export function alignGitHubIssueForms(
  input,
  { authorization = {}, client = new GitHubIssueFormClient() } = {},
) {
  const warnings = [...client.ensureAvailable()];
  const target = parseRepositoryTarget(input);
  const inspection = client.inspectRepository(target);
  warnings.push(...inspection.warnings);
  const mode = repositoryMode(inspection.ownerType);
  const desiredSet = authorIssueFormSet(mode ?? 'organization');
  const { blockers, plan } = buildIssueFormRepositoryPlan(inspection, desiredSet);
  const digest = planDigest(plan);
  const approval = evaluateIssueFormRepositoryAuthorization(plan, digest, authorization);
  const base = {
    mode: 'align_repository',
    target: inspection.target,
    repositoryMode: mode,
    branch: inspection.defaultBranch,
    inspection,
    plannedMutation: plan,
    authorization: approval,
    warnings: [...warnings, ...desiredSet.warnings],
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
      verification: {
        status: 'verified',
        checks: ['all four managed files align'],
        mismatches: [],
        errors: [],
      },
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
    const result = client.putFile(inspection.target, inspection.defaultBranch, operation);
    writes.push(
      result.ok
        ? {
            operation: `${operation.kind} ${operation.path}`,
            path: operation.path,
            status: 'succeeded',
            sha: result.value.sha,
            commitSha: result.value.commitSha,
          }
        : {
            operation: `${operation.kind} ${operation.path}`,
            path: operation.path,
            status: 'failed',
            error: result.error,
          },
    );
    if (!result.ok) break;
  }

  const mutated = writes.some(({ status }) => status === 'succeeded');
  const verification = verifyAlignment(client, inspection.target, mode);
  const complete =
    writes.length === plan.operations.length &&
    writes.every(({ status }) => status === 'succeeded') &&
    verification.status === 'verified';
  return {
    ...base,
    status: complete ? 'aligned_after_write' : mutated ? 'partial' : 'failed',
    mutatesGitHub: mutated,
    blockers: [],
    writes,
    verification,
    operations: writes.map(({ operation }) => operation),
  };
}
