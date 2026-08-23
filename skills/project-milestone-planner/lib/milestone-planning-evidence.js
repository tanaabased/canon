import buildMilestonePlanningEvidence from '../utils/build-milestone-planning-evidence.js';
import normalizeMilestoneTarget from '../utils/normalize-milestone-target.js';

/**
 * Collects the available read-only evidence for planning one project milestone.
 *
 * Partial reads remain visible so an unavailable surface is never mistaken for absence.
 *
 * @param {string} rawTarget Explicit milestone URL or OWNER/REPO#NUMBER.
 * @param {object} client Injected read-only GitHub client.
 * @returns {object} Ready, partial, or unresolved milestone-planning evidence.
 */
export function inspectMilestonePlanningEvidence(rawTarget, client) {
  const target = normalizeMilestoneTarget(rawTarget);
  const availability = client.ensureAvailable();
  const errors = [];
  const warnings = [];

  if (!availability.ok) {
    return {
      ...buildMilestonePlanningEvidence({ target }),
      errors: [availability.message],
      status: 'unresolved',
      warnings,
    };
  }
  if (!availability.authenticated && availability.message) warnings.push(availability.message);

  let repository = null;
  let milestone = null;
  let items = [];
  let itemsObserved = false;

  for (const [label, read] of [
    ['repository', () => client.fetchRepository(target)],
    ['milestone', () => client.fetchMilestone(target)],
    [
      'repository tasks and pull requests',
      () => {
        const observed = client.fetchIssueLikeItems(target);
        itemsObserved = true;
        return observed;
      },
    ],
  ]) {
    try {
      const value = read();
      if (label === 'repository') repository = value;
      else if (label === 'milestone') milestone = value;
      else items = value;
    } catch (error) {
      errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const evidence = buildMilestonePlanningEvidence({ items, milestone, repository, target });
  const complete = repository && milestone && itemsObserved;
  const observed = repository || milestone || itemsObserved;
  return {
    ...evidence,
    errors,
    status: complete ? 'ready' : observed ? 'partial' : 'unresolved',
    warnings,
  };
}
