import path from 'node:path';

import extractCheckIdentifiers from '../utils/extract-check-identifiers.js';
import extractFailureSnippet, { tailFailureLines } from '../utils/extract-failure-snippet.js';
import isFailingCheck from '../utils/is-failing-check.js';

function analyzeCheck(check, { client, context, maxLines, repoRoot }) {
  const detailsUrl = check.detailsUrl || check.link || '';
  const { jobId, runId } = extractCheckIdentifiers(detailsUrl);
  const base = { detailsUrl, jobId, name: check.name || '', runId };

  if (!runId) {
    return {
      ...base,
      note: 'No GitHub Actions run id detected in detailsUrl.',
      status: 'external',
    };
  }

  const run = client.fetchRunMetadata(runId, repoRoot);
  const logResult = client.fetchCheckLog({ jobId, repoRoot, runId });
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

/**
 * Resolves a pull request and inspects each failing check through an injected
 * GitHub command client.
 *
 * @param {object} options Inspection options.
 * @param {object} client GitHub command client.
 * @returns {{pr: string, results: object[]}} Normalized inspection result.
 */
export function inspectPrChecks(options, client) {
  const repoRoot = client.findGitRoot(path.resolve(options.repo));
  if (!repoRoot) throw new Error('not inside a Git repository.');

  const availability = client.ensureAvailable(repoRoot);
  if (!availability.ok) throw new Error(availability.message);

  const pr = client.resolvePr(options.pr, repoRoot);
  const failingChecks = client.fetchChecks(pr, repoRoot).filter(isFailingCheck);
  const results = failingChecks.map((check) =>
    analyzeCheck(check, {
      client,
      context: options.context,
      maxLines: options.maxLines,
      repoRoot,
    }),
  );

  return { pr, results };
}
