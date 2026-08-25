import {
  normalizeObservedComment,
  normalizeObservedIssueField,
  observedIssueTypeName,
  observedLabelNames,
  observedWorkSize,
} from '../../task-author/lib/task-observation.js';
import { parseFallbackMetadata } from '../../task-author/utils/parse-fallback-metadata.js';

function milestoneIdentity(milestone) {
  if (!milestone || milestone.number === undefined || milestone.number === null) return null;
  return {
    number: String(milestone.number),
    title: milestone.title || '',
    url: milestone.html_url || milestone.url || '',
  };
}

function normalizeTask(item, details = {}) {
  const fields = (details.fields ?? item.issue_field_values ?? []).map(normalizeObservedIssueField);
  const fallback = parseFallbackMetadata(item.body || '');
  const { source, value } = observedWorkSize(fields, fallback.fallback);
  return {
    body: item.body || '',
    comments: (details.comments ?? []).map(normalizeObservedComment),
    id: `issue:${item.number}`,
    labels: observedLabelNames(item.labels).sort(),
    metadata: {
      fallback: fallback.fallback,
      fallbackErrors: fallback.errors,
      fields,
      workSize: { source, value },
    },
    milestone: milestoneIdentity(item.milestone),
    number: String(item.number),
    state: String(item.state || '').toLowerCase(),
    title: item.title || '',
    type: observedIssueTypeName(item),
    updatedAt: item.updated_at || item.updatedAt || '',
    url: item.html_url || item.url || '',
  };
}

function normalizePullRequest(item) {
  return {
    body: item.body || '',
    id: `pr:${item.number}`,
    mergedAt: item.merged_at || item.pull_request?.merged_at || null,
    milestone: milestoneIdentity(item.milestone),
    number: String(item.number),
    state: String(item.state || '').toLowerCase(),
    title: item.title || '',
    updatedAt: item.updated_at || item.updatedAt || '',
    url: item.html_url || item.url || '',
  };
}

function uniqueByNumber(values) {
  return [...new Map(values.map((value) => [String(value.number), value])).values()].sort(
    (left, right) => Number(left.number) - Number(right.number),
  );
}

/**
 * Projects one bounded manifest into stable milestone-planning evidence.
 *
 * @param {object} input Raw bounded evidence.
 * @param {object[]} [input.tasks] Exact task records from membership or the manifest.
 * @param {object[]} [input.pullRequests] Exact pull-request records from membership or the manifest.
 * @param {Map<string, object>} [input.taskDetails] Field and comment evidence keyed by task number.
 * @returns {object} Deterministic evidence for semantic milestone planning.
 */
export default function buildMilestonePlanningEvidence({
  manifest = {},
  memberPullRequestNumbers = [],
  memberTaskNumbers = [],
  milestone = null,
  pullRequests = [],
  repository = null,
  taskDetails = new Map(),
  tasks = [],
  target,
}) {
  const existingTasks = uniqueByNumber(
    tasks.map((item) => normalizeTask(item, taskDetails.get(String(item.number)))),
  );
  const normalizedPullRequests = uniqueByNumber(pullRequests.map(normalizePullRequest));
  const memberTasks = new Set(memberTaskNumbers.map(String));
  const memberPullRequests = new Set(memberPullRequestNumbers.map(String));
  return {
    mutatesGitHub: false,
    target,
    manifest: {
      pullRequestNumbers: [...new Set((manifest.pullRequestNumbers ?? []).map(Number))].sort(
        (left, right) => left - right,
      ),
      taskNumbers: [...new Set((manifest.taskNumbers ?? []).map(Number))].sort(
        (left, right) => left - right,
      ),
    },
    repository: repository
      ? {
          defaultBranch: repository.defaultBranchRef?.name || '',
          description: repository.description || '',
          nameWithOwner: repository.nameWithOwner || target.slug,
          url: repository.url || `https://github.com/${target.slug}`,
        }
      : null,
    milestone: milestone
      ? {
          closedIssues: milestone.closed_issues ?? null,
          description: milestone.description || '',
          dueOn: milestone.due_on || null,
          id: `milestone:${milestone.number}`,
          number: String(milestone.number),
          openIssues: milestone.open_issues ?? null,
          state: String(milestone.state || '').toLowerCase(),
          title: milestone.title || '',
          updatedAt: milestone.updated_at || milestone.updatedAt || '',
          url: milestone.html_url || target.url,
        }
      : null,
    existingTasks,
    memberTasks: existingTasks.filter(({ number }) => memberTasks.has(number)),
    candidateTasks: existingTasks.filter(({ number }) => !memberTasks.has(number)),
    closedTasks: existingTasks.filter(({ state }) => state === 'closed'),
    pullRequests: normalizedPullRequests,
    memberPullRequests: normalizedPullRequests.filter(({ number }) =>
      memberPullRequests.has(number),
    ),
    mergedPullRequests: normalizedPullRequests.filter(({ mergedAt }) => mergedAt),
    evidenceIds: [
      ...(milestone ? [`milestone:${milestone.number}`] : []),
      ...existingTasks.map(({ id }) => id),
      ...normalizedPullRequests.map(({ id }) => id),
    ].sort(),
  };
}
