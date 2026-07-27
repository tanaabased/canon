import classifyTaskCompletion from '../utils/classify-task-completion.js';
import extractAcceptanceCriteria from '../utils/extract-acceptance-criteria.js';
import extractCheckIdentifiers from '../utils/extract-check-identifiers.js';
import extractFailureSnippet, { tailFailureLines } from '../utils/extract-failure-snippet.js';
import isFailingCheck from '../utils/is-failing-check.js';
import normalizePrEvidence from '../utils/normalize-pr-evidence.js';
import normalizePullRequestTarget from '../utils/normalize-pull-request-target.js';
import normalizeTaskTarget from '../utils/normalize-task-target.js';

function errorText(error) {
  return error instanceof Error ? error.message : String(error);
}

function normalizeComments(comments) {
  if (!Array.isArray(comments)) return [];
  return comments.map((comment) => ({
    author: comment.author?.login || '',
    body: comment.body || '',
    createdAt: comment.createdAt || '',
    url: comment.url || '',
  }));
}

function uniquePullRequestTargets(targets) {
  const seen = new Set();
  return targets
    .filter((target) => {
      const key = `${target.slug.toLowerCase()}#${target.number}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) =>
      `${left.slug.toLowerCase()}#${left.number}`.localeCompare(
        `${right.slug.toLowerCase()}#${right.number}`,
        undefined,
        { numeric: true },
      ),
    );
}

function analyzeFailingCheck(check, { client, context, maxLines, slug }) {
  const detailsUrl = check.detailsUrl || check.link || '';
  const { jobId, runId } = extractCheckIdentifiers(detailsUrl);
  const base = { detailsUrl, jobId, name: check.name || '', runId };

  if (!runId) {
    return {
      ...base,
      note: 'No GitHub Actions run id detected in the check details URL.',
      status: 'external',
    };
  }

  const run = client.fetchRunMetadata({ runId, slug });
  const logResult = client.fetchCheckLog({ jobId, runId, slug });
  if (logResult.status === 'pending') {
    return {
      ...base,
      note: logResult.error || 'Logs are not available yet.',
      run: run || undefined,
      status: 'log_pending',
    };
  }
  if (logResult.error) {
    return {
      ...base,
      error: logResult.error,
      run: run || undefined,
      status: 'log_unavailable',
    };
  }

  return {
    ...base,
    logSnippet: extractFailureSnippet(logResult.text, { context, maxLines }),
    logTail: tailFailureLines(logResult.text, maxLines),
    run: run || {},
    status: 'ok',
  };
}

function uncertainReport(target, message) {
  return {
    criteria: [],
    errors: [message],
    pullRequests: [],
    reason: 'The Task could not be inspected.',
    status: 'uncertain',
    target,
    task: null,
  };
}

/**
 * Inspects one GitHub-backed Task and classifies its completion evidence through
 * an injected read-only GitHub client.
 *
 * @param {object} options Task identity, explicit PR evidence, and log bounds.
 * @param {object} client GitHub command client.
 * @returns {object} Normalized Task completion report.
 */
export function inspectTaskCompletion(options, client) {
  const target = normalizeTaskTarget(options.task);
  const availability = client.ensureAvailable();
  if (!availability.ok) throw new Error(availability.message);

  let rawTask;
  try {
    rawTask = client.fetchTask(target);
  } catch (error) {
    return uncertainReport(target, errorText(error));
  }

  const task = {
    body: rawTask.body || '',
    comments: normalizeComments(rawTask.comments),
    milestone: rawTask.milestone || null,
    state: rawTask.state || '',
    title: rawTask.title || '',
    url: rawTask.url || target.url,
  };
  const criteria = extractAcceptanceCriteria(task.body);
  const errors = [];

  if (String(task.state).toUpperCase() === 'CLOSED') {
    const classification = classifyTaskCompletion({ criteria, errors, pullRequests: [], task });
    return { criteria, errors, pullRequests: [], target, task, ...classification };
  }

  let discoveredTargets = [];
  try {
    discoveredTargets = client.fetchLinkedPullRequests(target);
  } catch (error) {
    errors.push(errorText(error));
  }

  const explicitTargets = options.prs.map((value) =>
    normalizePullRequestTarget(value, target.slug),
  );
  const pullRequestTargets = uniquePullRequestTargets([...discoveredTargets, ...explicitTargets]);
  const pullRequests = [];

  for (const pullRequestTarget of pullRequestTargets) {
    try {
      const rawPullRequest = client.fetchPullRequest(pullRequestTarget);
      const defaultBranch = client.fetchDefaultBranch(pullRequestTarget.slug);
      let checks = [];
      try {
        checks = client.fetchChecks(pullRequestTarget);
      } catch (error) {
        errors.push(`${pullRequestTarget.slug}#${pullRequestTarget.number}: ${errorText(error)}`);
      }

      const normalized = normalizePrEvidence(rawPullRequest, {
        checks,
        defaultBranch,
        slug: pullRequestTarget.slug,
      });
      normalized.failureDetails = checks.filter(isFailingCheck).map((check) =>
        analyzeFailingCheck(check, {
          client,
          context: options.context,
          maxLines: options.maxLines,
          slug: pullRequestTarget.slug,
        }),
      );
      pullRequests.push(normalized);
    } catch (error) {
      errors.push(`${pullRequestTarget.slug}#${pullRequestTarget.number}: ${errorText(error)}`);
    }
  }

  const classification = classifyTaskCompletion({ criteria, errors, pullRequests, task });
  return { criteria, errors, pullRequests, target, task, ...classification };
}
