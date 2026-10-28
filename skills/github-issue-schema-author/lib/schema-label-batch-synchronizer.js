import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };
import planDigest from '../../../utils/plan-digest.js';
import { normalizeSchemaTarget } from '../utils/normalize-schema-target.js';
import { GitHubLabelClient } from './github-label-client.js';
import { synchronizeGitHubIssueLabels } from './schema-label-synchronizer.js';

function resolveSelection(input, client) {
  const organization = input.organization?.trim().toLowerCase() || null;
  if (organization && !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(organization)) {
    throw new Error('Expected an explicit GitHub organization login.');
  }
  const repositories = [
    ...new Set(
      (input.repositories ?? []).map((value) => normalizeSchemaTarget(value).slug.toLowerCase()),
    ),
  ].sort();
  if (!organization && repositories.length === 0) {
    throw new Error('An explicit organization or repository set is required.');
  }
  const inventory = organization ? client.listOrganizationRepositories(organization) : [];
  if (!Array.isArray(inventory)) throw new Error('Repository inventory is unavailable.');
  const targets = new Set(repositories);
  const excluded = [];
  for (const repo of inventory) {
    const target = normalizeSchemaTarget(repo.full_name);
    if (
      target.owner.toLowerCase() !== organization ||
      typeof repo.archived !== 'boolean' ||
      typeof repo.disabled !== 'boolean'
    ) {
      throw new Error('Repository inventory has an unexpected owner or incomplete availability.');
    }
    const slug = target.slug.toLowerCase();
    if (repo.archived || repo.disabled) {
      targets.delete(slug);
      excluded.push({ repository: slug, reason: repo.archived ? 'archived' : 'disabled' });
    } else targets.add(slug);
  }
  return {
    selection: { organization, repositories },
    targets: [...targets].sort(),
    excluded: excluded.sort((a, b) => a.repository.localeCompare(b.repository)),
  };
}

/**
 * Inspect or synchronize a label batch using the existing per-repository writer.
 * Apply re-plans the entire selection before checking its digest, then rechecks each
 * repository at its write boundary. Partial or uncertain writes stop the batch.
 */
export function synchronizeGitHubLabelBatch(
  input,
  { authorization = {}, client = new GitHubLabelClient(), policy = taskManagementSchema } = {},
) {
  const mode = input.mode ?? 'plan';
  if (!['inspect', 'plan', 'apply'].includes(mode)) throw new Error('Invalid label batch mode.');
  const { selection, targets, excluded } = resolveSelection(input, client);
  const previews = [];
  const blockers = [];
  for (const target of targets) {
    try {
      const report = synchronizeGitHubIssueLabels(target, { client, policy });
      previews.push(report);
      blockers.push(...report.blockers.map((reason) => `${target}: ${reason}`));
    } catch (error) {
      blockers.push(`${target}: ${error.message}`);
    }
  }
  const summary = {
    repositories: targets.length,
    aligned: previews.filter(({ status }) => status === 'aligned').length,
    creates: previews.reduce((total, r) => total + r.plannedMutation.creates.length, 0),
    updates: previews.reduce((total, r) => total + r.plannedMutation.updates.length, 0),
    excluded: excluded.length,
  };
  const base = { mode, selection, targets, excluded, summary, blockers, mutatesGitHub: false };
  if (mode === 'inspect') {
    return {
      ...base,
      status: blockers.length
        ? 'unresolved'
        : summary.creates + summary.updates
          ? 'drifted'
          : 'aligned',
      inspections: previews.map(({ inspection }) => inspection),
      operations: [],
    };
  }
  const plannedMutation = {
    selection,
    targets,
    excluded,
    repositories: previews.map(({ plannedMutation }) => plannedMutation),
    renames: [],
    deletions: [],
  };
  const digest = planDigest(plannedMutation);
  const approved = mode === 'apply' && authorization.approvedDigest === digest;
  const report = {
    ...base,
    plannedMutation,
    authorization: { approved, digest },
    results: [],
    remaining: [...targets],
  };
  if (blockers.length) return { ...report, status: 'blocked' };
  if (summary.creates + summary.updates === 0) {
    return { ...report, status: 'aligned', remaining: [] };
  }
  if (!approved) return { ...report, status: mode === 'apply' ? 'stale' : 'approval_required' };

  for (const preview of previews) {
    const target = preview.target.slug;
    let result;
    try {
      result =
        preview.status === 'aligned'
          ? preview
          : synchronizeGitHubIssueLabels(target, {
              client,
              policy,
              authorization: {
                approvedRepository: target,
                approvedDigest: preview.authorization.digest,
              },
            });
    } catch (error) {
      result = { status: 'unresolved', mutatesGitHub: null, error: error.message };
    }
    report.results.push({ repository: target, ...result });
    if (result.mutatesGitHub === true) report.mutatesGitHub = true;
    if (result.mutatesGitHub === null && report.mutatesGitHub !== true) report.mutatesGitHub = null;
    if (!['updated', 'aligned'].includes(result.status)) {
      return { ...report, status: report.mutatesGitHub !== false ? 'partial' : 'failed' };
    }
    report.remaining.shift();
  }
  return { ...report, status: 'updated' };
}
