/**
 * Classifies Task completion from acceptance, query, and pull request evidence.
 *
 * @param {object} evidence Normalized Task evidence.
 * @returns {{reason: string, status: 'blocked'|'complete'|'pending'|'ready'|'uncertain'}} Result.
 */
export default function classifyTaskCompletion({ criteria, errors, pullRequests, task }) {
  if (String(task?.state ?? '').toUpperCase() === 'CLOSED') {
    return { reason: 'The GitHub Issue is already closed.', status: 'complete' };
  }
  if (criteria.length === 0) {
    return {
      reason: 'The Task has no structured acceptance-criteria checkboxes.',
      status: 'uncertain',
    };
  }

  const incompleteCount = criteria.filter((criterion) => !criterion.complete).length;
  if (incompleteCount > 0) {
    return {
      reason: `${incompleteCount} acceptance criteria remain incomplete.`,
      status: 'blocked',
    };
  }
  if (errors.length > 0) {
    return { reason: 'Some required GitHub evidence could not be inspected.', status: 'uncertain' };
  }

  const blocked = pullRequests.filter((pullRequest) => pullRequest.outcome === 'blocked');
  if (blocked.length > 0) {
    return { reason: `${blocked.length} pull request paths are blocked.`, status: 'blocked' };
  }

  const pending = pullRequests.filter((pullRequest) => pullRequest.outcome === 'pending');
  if (pending.length > 0) {
    return { reason: `${pending.length} pull request paths remain pending.`, status: 'pending' };
  }

  const uncertain = pullRequests.filter((pullRequest) => pullRequest.outcome === 'uncertain');
  if (uncertain.length > 0) {
    return { reason: 'Some pull request evidence is ambiguous.', status: 'uncertain' };
  }

  const landed = pullRequests.some((pullRequest) => pullRequest.outcome === 'landed');
  if (landed || pullRequests.length === 0) {
    return {
      reason: landed
        ? 'Acceptance criteria are complete and linked delivery has landed.'
        : 'Acceptance criteria are complete and no pull request evidence is required.',
      status: 'ready',
    };
  }

  return {
    reason: 'Linked pull requests were closed without delivering the Task.',
    status: 'blocked',
  };
}
