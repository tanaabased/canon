import isFailingCheck from './is-failing-check.js';

const PENDING_CHECK_VALUES = new Set(['expected', 'in_progress', 'pending', 'queued', 'waiting']);

function normalizeValue(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isPendingCheck(check) {
  return [check.bucket, check.conclusion, check.state, check.status].some((value) =>
    PENDING_CHECK_VALUES.has(normalizeValue(value)),
  );
}

/**
 * Normalizes one pull request and its checks into task-completion evidence.
 *
 * @param {object} pullRequest Raw `gh pr view` response.
 * @param {object} options Related Project and check state.
 * @returns {object} Stable pull request evidence with one outcome.
 */
export default function normalizePrEvidence(pullRequest, { checks = [], defaultBranch, slug }) {
  const state = String(pullRequest.state ?? '').toUpperCase();
  const merged = state === 'MERGED' || Boolean(pullRequest.mergedAt);
  const targetIsDefault = Boolean(defaultBranch && pullRequest.baseRefName === defaultBranch);
  const failingChecks = checks.filter(isFailingCheck);
  const pendingChecks = checks.filter((check) => !isFailingCheck(check) && isPendingCheck(check));
  const blockers = [];
  const waiting = [];

  if (merged && !targetIsDefault) {
    blockers.push(
      `merged into ${pullRequest.baseRefName || 'an unknown branch'}, not ${defaultBranch}`,
    );
  } else if (!merged && state === 'CLOSED') {
    blockers.push('pull request closed without merging');
  } else if (!merged) {
    if (!targetIsDefault) {
      blockers.push(
        `targets ${pullRequest.baseRefName || 'an unknown branch'}, not ${defaultBranch}`,
      );
    }
    if (pullRequest.reviewDecision === 'CHANGES_REQUESTED') {
      blockers.push('review changes requested');
    }
    if (pullRequest.mergeable === 'CONFLICTING' || pullRequest.mergeStateStatus === 'DIRTY') {
      blockers.push('merge conflict');
    }
    if (failingChecks.length > 0) blockers.push(`${failingChecks.length} failing checks`);

    if (pullRequest.isDraft) waiting.push('pull request is a draft');
    if (pullRequest.reviewDecision === 'REVIEW_REQUIRED') waiting.push('review is required');
    if (pendingChecks.length > 0) waiting.push(`${pendingChecks.length} pending checks`);
    if (pullRequest.mergeStateStatus === 'BEHIND') waiting.push('branch is behind the target');
    if (pullRequest.mergeStateStatus === 'BLOCKED' && blockers.length === 0) {
      waiting.push('merge requirements are not satisfied');
    }
    if (state === 'OPEN' && blockers.length === 0 && waiting.length === 0) {
      waiting.push('pull request is still open');
    }
  }

  let outcome = 'uncertain';
  if (merged && targetIsDefault) outcome = 'landed';
  else if (state === 'CLOSED') outcome = 'discarded';
  else if (blockers.length > 0) outcome = 'blocked';
  else if (waiting.length > 0) outcome = 'pending';

  return {
    baseRefName: pullRequest.baseRefName || '',
    blockers,
    checkCounts: {
      failing: failingChecks.length,
      pending: pendingChecks.length,
      total: checks.length,
    },
    defaultBranch,
    isDraft: Boolean(pullRequest.isDraft),
    merged,
    number: String(pullRequest.number ?? ''),
    outcome,
    reviewDecision: pullRequest.reviewDecision || '',
    slug,
    state,
    targetIsDefault,
    title: pullRequest.title || '',
    url: pullRequest.url || `https://github.com/${slug}/pull/${pullRequest.number}`,
    waiting,
  };
}
