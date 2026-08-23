function labelNames(labels) {
  if (!Array.isArray(labels)) return [];
  return labels
    .map((label) => (typeof label === 'string' ? label : label?.name))
    .filter(Boolean)
    .sort();
}

function milestoneIdentity(milestone) {
  if (!milestone || milestone.number === undefined || milestone.number === null) return null;
  return {
    number: String(milestone.number),
    title: milestone.title || '',
    url: milestone.html_url || milestone.url || '',
  };
}

function normalizeItem(item) {
  return {
    body: item.body || '',
    labels: labelNames(item.labels),
    milestone: milestoneIdentity(item.milestone),
    number: String(item.number),
    state: String(item.state || '').toLowerCase(),
    title: item.title || '',
    updatedAt: item.updated_at || item.updatedAt || '',
    url: item.html_url || item.url || '',
  };
}

function normalizePullRequest(item) {
  const normalized = normalizeItem(item);
  return {
    ...normalized,
    mergedAt: item.pull_request?.merged_at || item.merged_at || null,
  };
}

/**
 * Projects raw GitHub repository evidence into a stable milestone-planning shape.
 *
 * @param {object} input Raw evidence.
 * @param {object | null} input.repository Repository metadata.
 * @param {object | null} input.milestone Milestone metadata.
 * @param {object[]} input.items Repository issue-like records, including pull requests.
 * @param {object} input.target Normalized milestone target.
 * @returns {object} Deterministic evidence for semantic milestone planning.
 */
export default function buildMilestonePlanningEvidence({
  items = [],
  milestone = null,
  repository = null,
  target,
}) {
  const milestoneNumber = String(target.number);
  const rawTasks = items.filter((item) => !item.pull_request);
  const rawPullRequests = items.filter((item) => item.pull_request);
  const existingTasks = rawTasks.map(normalizeItem);
  const pullRequests = rawPullRequests.map(normalizePullRequest);
  const isMember = (item) => item.milestone?.number === milestoneNumber;
  const memberTasks = existingTasks.filter(isMember);
  const memberPullRequests = pullRequests.filter(isMember);

  return {
    mutatesGitHub: false,
    target,
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
          number: String(milestone.number),
          openIssues: milestone.open_issues ?? null,
          state: String(milestone.state || '').toLowerCase(),
          title: milestone.title || '',
          url: milestone.html_url || target.url,
        }
      : null,
    existingTasks,
    memberTasks,
    candidateTasks: existingTasks.filter((item) => !isMember(item)),
    pullRequests,
    memberPullRequests,
    deliveredWork: [
      ...existingTasks.filter((item) => item.state === 'closed'),
      ...pullRequests.filter((item) => item.state === 'closed' || item.mergedAt),
    ],
  };
}
