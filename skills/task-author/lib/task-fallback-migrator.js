import { GitHubTaskClient } from './github-task-client.js';
import { readTaskState } from './task-state-reader.js';
import planDigest from '../../../utils/plan-digest.js';
import { buildFallbackMigrationPlan } from '../utils/build-fallback-migration-plan.js';
import { evaluateTaskPublication } from '../utils/evaluate-task-publication.js';
import { normalizeTaskTarget } from '../utils/normalize-task-target.js';
import { parseFallbackMetadata } from '../utils/parse-fallback-metadata.js';
import { verifyCreatedTask } from '../utils/verify-created-task.js';

function phaseHasMutation(phase) {
  return Object.keys(phase.mutation).length > 0;
}

/** Migrate verified fallback values to native fields before removing their body keys. */
export function migrateTaskFallback(input = {}, { githubClient = new GitHubTaskClient() } = {}) {
  githubClient.ensureAvailable();
  const target = normalizeTaskTarget(input.target);
  if (!target.issueNumber) throw new Error('Fallback migration requires OWNER/REPO#NUMBER.');
  const capabilities = githubClient.inspectRepository(target);
  const fields = capabilities.issueFields.status !== 'not_applicable';
  const current = readTaskState(githubClient, target, { fields });
  const parsed = parseFallbackMetadata(current.issue?.body ?? '');
  const { blockers: planBlockers, plan } = buildFallbackMigrationPlan(
    target,
    capabilities,
    current,
    parsed,
  );
  const digest = planDigest(plan);
  const publication = evaluateTaskPublication(plan, digest, input.publication);
  const blockers = [...current.errors, ...planBlockers];
  if (!parsed.found) blockers.push('The issue body has no recognized fallback capsule.');
  const base = {
    mode: 'migrate_fallback',
    target,
    current,
    plannedMutation: plan,
    publication,
    capabilities,
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
  if (!plan.phases.some(phaseHasMutation)) {
    return {
      ...base,
      status: plan.conflicts.length > 0 || plan.unavailable.length > 0 ? 'partial' : 'aligned',
      mutatesGitHub: false,
      blockers: [],
      writes: [],
      verification: verifyCreatedTask(plan, current),
    };
  }
  if (!publication.approved) {
    return {
      ...base,
      status: publication.findings.length > 0 ? 'publication_blocked' : 'approval_required',
      mutatesGitHub: false,
      blockers: [],
      writes: [],
      verification: null,
    };
  }

  const writes = [];
  const nativePhase = plan.phases[0];
  if (phaseHasMutation(nativePhase)) {
    const result = githubClient.updateIssue(target, target.issueNumber, nativePhase.mutation);
    writes.push(
      result.ok
        ? { operation: nativePhase.name, status: 'succeeded' }
        : { operation: nativePhase.name, status: 'failed', error: result.error },
    );
    if (!result.ok) {
      return {
        ...base,
        status: 'failed',
        mutatesGitHub: false,
        blockers: [],
        writes,
        verification: null,
      };
    }
  }

  const nativeObserved = readTaskState(githubClient, target, { fields });
  const nativePlan = {
    ...plan,
    issue: { ...plan.issue, body: nativeObserved.issue?.body ?? null },
    expected: { ...plan.expected, labels: plan.expected.labels },
  };
  const nativeVerification = nativeObserved.issue
    ? verifyCreatedTask(nativePlan, nativeObserved)
    : { status: 'unavailable', checks: [], mismatches: [] };
  const nativeManagedMismatches = nativeVerification.mismatches.filter(
    ({ key }) => key === 'type' || key.startsWith('field:'),
  );
  if (nativeObserved.errors.length > 0 || nativeManagedMismatches.length > 0) {
    nativeVerification.errors = nativeObserved.errors;
    return {
      ...base,
      status: 'partial',
      mutatesGitHub: writes.length > 0,
      blockers: [],
      writes,
      verification: nativeVerification,
    };
  }

  const bodyPhase = plan.phases[1];
  if (phaseHasMutation(bodyPhase)) {
    const result = githubClient.updateIssue(target, target.issueNumber, bodyPhase.mutation);
    writes.push(
      result.ok
        ? { operation: bodyPhase.name, status: 'succeeded' }
        : { operation: bodyPhase.name, status: 'failed', error: result.error },
    );
  }
  const observed = readTaskState(githubClient, target, { fields });
  const verification = observed.issue
    ? verifyCreatedTask(plan, observed)
    : { status: 'unavailable', checks: [], mismatches: [] };
  verification.errors = observed.errors;
  const complete =
    writes.every(({ status }) => status === 'succeeded') &&
    verification.status === 'verified' &&
    observed.errors.length === 0;
  return {
    ...base,
    status: complete
      ? plan.conflicts.length > 0 || plan.unavailable.length > 0
        ? 'partial'
        : 'migrated'
      : 'partial',
    mutatesGitHub: writes.length > 0,
    blockers: [],
    writes,
    verification,
  };
}
