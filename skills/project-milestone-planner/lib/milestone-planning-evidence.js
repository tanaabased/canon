import buildMilestonePlanningEvidence from '../utils/build-milestone-planning-evidence.js';
import normalizeMilestoneEvidenceManifest from '../utils/normalize-milestone-evidence-manifest.js';
import normalizeMilestoneTarget from '../utils/normalize-milestone-target.js';

function errorText(error) {
  return error instanceof Error ? error.message : String(error);
}

function addUnique(map, item) {
  if (item?.number !== undefined && item?.number !== null) map.set(String(item.number), item);
}

/**
 * Collects bounded read-only evidence for planning one project milestone.
 *
 * Partial reads remain visible so an unavailable requested surface is never mistaken for absence.
 *
 * @param {string} rawTarget Explicit milestone URL or OWNER/REPO#NUMBER.
 * @param {object} client Injected read-only GitHub client.
 * @param {object} [rawManifest] Explicit bounded task and pull-request selectors.
 * @returns {object} Ready, partial, or unresolved milestone-planning evidence.
 */
export function inspectMilestonePlanningEvidence(rawTarget, client, rawManifest = {}) {
  const target = normalizeMilestoneTarget(rawTarget);
  const manifest = normalizeMilestoneEvidenceManifest(rawManifest);
  const availability = client.ensureAvailable();
  const errors = [];
  const warnings = [];

  if (!availability.ok) {
    return {
      ...buildMilestonePlanningEvidence({ manifest, target }),
      errors: [availability.message],
      status: 'unresolved',
      warnings,
    };
  }
  if (!availability.authenticated && availability.message) warnings.push(availability.message);

  let repository = null;
  let milestone = null;
  let membershipObserved = false;
  let memberItems = [];

  for (const [label, read] of [
    ['repository', () => client.fetchRepository(target)],
    ['milestone', () => client.fetchMilestone(target)],
    ['milestone membership', () => client.fetchMilestoneItems(target)],
  ]) {
    try {
      const value = read();
      if (label === 'repository') repository = value;
      else if (label === 'milestone') milestone = value;
      else {
        memberItems = value;
        membershipObserved = true;
      }
    } catch (error) {
      errors.push(`${label}: ${errorText(error)}`);
    }
  }

  const taskMap = new Map();
  const pullRequestMap = new Map();
  for (const item of memberItems) {
    if (item.pull_request) addUnique(pullRequestMap, item);
    else addUnique(taskMap, item);
  }
  const memberTaskNumbers = [...taskMap.keys()];
  const memberPullRequestNumbers = [...pullRequestMap.keys()];

  for (const number of manifest.taskNumbers) {
    if (taskMap.has(String(number))) continue;
    try {
      const item = client.fetchIssue(target, number);
      if (item.pull_request) {
        errors.push(`task #${number}: the requested item is a pull request, not a task.`);
      } else addUnique(taskMap, item);
    } catch (error) {
      errors.push(`task #${number}: ${errorText(error)}`);
    }
  }

  for (const number of new Set([
    ...memberPullRequestNumbers.map(Number),
    ...manifest.pullRequestNumbers,
  ])) {
    try {
      addUnique(pullRequestMap, client.fetchPullRequest(target, number));
    } catch (error) {
      errors.push(`pull request #${number}: ${errorText(error)}`);
    }
  }

  const taskDetails = new Map();
  for (const number of taskMap.keys()) {
    const details = { comments: [], fields: [] };
    try {
      details.fields = client.fetchIssueFieldValues(target, number);
    } catch (error) {
      errors.push(`task #${number} fields: ${errorText(error)}`);
    }
    try {
      details.comments = client.fetchIssueComments(target, number);
    } catch (error) {
      errors.push(`task #${number} comments: ${errorText(error)}`);
    }
    taskDetails.set(number, details);
  }

  const evidence = buildMilestonePlanningEvidence({
    manifest,
    memberPullRequestNumbers,
    memberTaskNumbers,
    milestone,
    pullRequests: [...pullRequestMap.values()],
    repository,
    taskDetails,
    tasks: [...taskMap.values()],
    target,
  });
  const complete = repository && milestone && membershipObserved && errors.length === 0;
  const observed = repository || milestone || membershipObserved;
  return {
    ...evidence,
    errors,
    status: complete ? 'ready' : observed ? 'partial' : 'unresolved',
    warnings,
  };
}
