import { spawnSync } from 'node:child_process';

const PENDING_LOG_MARKERS = ['still in progress', 'log will be available when it is complete'];

const LINKED_PULL_REQUESTS_QUERY = `
  query TaskCompletionPullRequests($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        closedByPullRequestsReferences(first: 100, includeClosedPrs: true) {
          nodes {
            number
            url
            repository {
              nameWithOwner
            }
          }
        }
      }
    }
  }
`;

function defaultCommandRunner(command, args, { raw = false } = {}) {
  const result = spawnSync(command, args, { encoding: raw ? undefined : 'utf8' });
  const stdout = raw
    ? Buffer.isBuffer(result.stdout)
      ? result.stdout
      : Buffer.from(String(result.stdout ?? ''))
    : (result.stdout ?? '');
  const stderr = Buffer.isBuffer(result.stderr)
    ? result.stderr.toString('utf8')
    : String(result.stderr ?? '');

  return {
    error: result.error ?? null,
    returncode: result.status ?? 1,
    stderr,
    stdout,
  };
}

function errorMessage(result, fallback) {
  const stdout = Buffer.isBuffer(result.stdout) ? result.stdout.toString('utf8') : result.stdout;
  return (result.stderr || stdout || '').trim() || fallback;
}

function parseJson(result, parseError, shapeError, isExpectedShape) {
  let data;
  try {
    data = JSON.parse(result.stdout || '{}');
  } catch {
    throw new Error(parseError);
  }
  if (!isExpectedShape(data)) throw new Error(shapeError);
  return data;
}

function parseAvailableFields(message) {
  if (!message.includes('Available fields:')) return [];
  const lines = message.split('\n');
  const markerIndex = lines.findIndex((line) => line.includes('Available fields:'));
  return lines
    .slice(markerIndex + 1)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseCheckOutput(stdout) {
  try {
    const data = JSON.parse(stdout || '');
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function isPendingLogMessage(message) {
  const lowered = String(message).toLowerCase();
  return PENDING_LOG_MARKERS.some((marker) => lowered.includes(marker));
}

/**
 * Creates a read-only GitHub client whose command boundary can be replaced by
 * a deterministic fake runner.
 *
 * @param {object} [options] Client dependencies.
 * @param {Function} [options.runner=defaultCommandRunner] Command execution boundary.
 * @returns {object} GitHub task, pull request, check, and log inspection operations.
 */
export function createGitHubTaskClient({ runner = defaultCommandRunner } = {}) {
  const runGh = (args, options) => runner('gh', args, options);

  function ensureAvailable() {
    const versionResult = runGh(['--version']);
    if (versionResult.error) {
      return { message: 'gh is not installed or not on PATH.', ok: false };
    }

    const authResult = runGh(['auth', 'status']);
    return authResult.returncode === 0
      ? { ok: true }
      : { message: errorMessage(authResult, 'gh not authenticated.'), ok: false };
  }

  function fetchTask(target) {
    const fields = ['number', 'title', 'state', 'body', 'url', 'comments', 'milestone'];
    const result = runGh([
      'issue',
      'view',
      String(target.number),
      '--repo',
      target.slug,
      '--json',
      fields.join(','),
    ]);
    if (result.returncode !== 0) {
      throw new Error(
        errorMessage(result, `unable to inspect task ${target.slug}#${target.number}.`),
      );
    }
    return parseJson(
      result,
      'unable to parse task JSON.',
      'unexpected task JSON shape.',
      (data) => data && typeof data === 'object' && !Array.isArray(data),
    );
  }

  function fetchLinkedPullRequests(target) {
    const result = runGh([
      'api',
      'graphql',
      '-f',
      `query=${LINKED_PULL_REQUESTS_QUERY}`,
      '-F',
      `owner=${target.owner}`,
      '-F',
      `repo=${target.repo}`,
      '-F',
      `number=${target.number}`,
    ]);
    if (result.returncode !== 0) {
      throw new Error(errorMessage(result, 'unable to inspect linked pull requests.'));
    }

    const data = parseJson(
      result,
      'unable to parse linked pull request JSON.',
      'unexpected linked pull request JSON shape.',
      (value) => value && typeof value === 'object' && !Array.isArray(value),
    );
    const nodes = data?.data?.repository?.issue?.closedByPullRequestsReferences?.nodes;
    if (!Array.isArray(nodes)) throw new Error('unexpected linked pull request JSON shape.');

    return nodes.map((node) => ({
      number: String(node.number),
      slug: node.repository?.nameWithOwner || target.slug,
      url: node.url || '',
    }));
  }

  function fetchPullRequest(target) {
    const fields = [
      'number',
      'title',
      'state',
      'url',
      'body',
      'isDraft',
      'baseRefName',
      'mergeable',
      'mergeStateStatus',
      'reviewDecision',
      'mergedAt',
    ];
    const result = runGh([
      'pr',
      'view',
      String(target.number),
      '--repo',
      target.slug,
      '--json',
      fields.join(','),
    ]);
    if (result.returncode !== 0) {
      throw new Error(
        errorMessage(result, `unable to inspect pull request ${target.slug}#${target.number}.`),
      );
    }
    return parseJson(
      result,
      'unable to parse pull request JSON.',
      'unexpected pull request JSON shape.',
      (data) => data && typeof data === 'object' && !Array.isArray(data),
    );
  }

  function fetchDefaultBranch(slug) {
    const result = runGh(['repo', 'view', slug, '--json', 'defaultBranchRef']);
    if (result.returncode !== 0) {
      throw new Error(errorMessage(result, `unable to resolve the default branch for ${slug}.`));
    }
    const data = parseJson(
      result,
      'unable to parse repository JSON.',
      'unexpected repository JSON shape.',
      (value) => value && typeof value === 'object' && !Array.isArray(value),
    );
    const branch = data?.defaultBranchRef?.name;
    if (!branch) throw new Error(`unable to resolve the default branch for ${slug}.`);
    return branch;
  }

  function fetchChecks(target) {
    const primaryFields = ['name', 'state', 'conclusion', 'detailsUrl', 'startedAt', 'completedAt'];
    let result = runGh([
      'pr',
      'checks',
      String(target.number),
      '--repo',
      target.slug,
      '--json',
      primaryFields.join(','),
    ]);
    let data = parseCheckOutput(result.stdout);
    if (data) return data;

    if (result.returncode !== 0) {
      const message = errorMessage(result, 'gh pr checks failed.');
      const availableFields = parseAvailableFields(message);
      const fallbackFields = [
        'name',
        'state',
        'bucket',
        'link',
        'startedAt',
        'completedAt',
        'workflow',
      ].filter((field) => availableFields.includes(field));
      if (fallbackFields.length === 0) throw new Error(message);

      result = runGh([
        'pr',
        'checks',
        String(target.number),
        '--repo',
        target.slug,
        '--json',
        fallbackFields.join(','),
      ]);
      data = parseCheckOutput(result.stdout);
      if (data) return data;
      if (result.returncode !== 0) throw new Error(errorMessage(result, 'gh pr checks failed.'));
    }

    throw new Error(
      result.stdout ? 'unexpected checks JSON shape.' : 'unable to parse checks JSON.',
    );
  }

  function fetchRunMetadata({ runId, slug }) {
    const fields = [
      'conclusion',
      'status',
      'workflowName',
      'name',
      'event',
      'headBranch',
      'headSha',
      'url',
    ];
    const result = runGh(['run', 'view', runId, '--repo', slug, '--json', fields.join(',')]);
    if (result.returncode !== 0) return null;
    try {
      const data = JSON.parse(result.stdout || '{}');
      return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  function fetchRunLog({ runId, slug }) {
    const result = runGh(['run', 'view', runId, '--repo', slug, '--log']);
    return result.returncode === 0
      ? { error: '', text: result.stdout }
      : { error: errorMessage(result, 'gh run view failed'), text: '' };
  }

  function fetchJobLog({ jobId, slug }) {
    const result = runGh(['api', `/repos/${slug}/actions/jobs/${jobId}/logs`], { raw: true });
    if (result.returncode !== 0) {
      return { error: errorMessage(result, 'gh api job logs failed'), text: '' };
    }

    const payload = Buffer.isBuffer(result.stdout)
      ? result.stdout
      : Buffer.from(String(result.stdout ?? ''));
    if (payload.subarray(0, 2).equals(Buffer.from('PK'))) {
      return { error: 'Job logs returned a zip archive; unable to parse.', text: '' };
    }
    return { error: '', text: payload.toString('utf8') };
  }

  function fetchCheckLog({ jobId, runId, slug }) {
    const runLog = fetchRunLog({ runId, slug });
    if (!runLog.error) return { error: '', status: 'ok', text: runLog.text };

    if (isPendingLogMessage(runLog.error) && jobId) {
      const jobLog = fetchJobLog({ jobId, slug });
      if (jobLog.text) return { error: '', status: 'ok', text: jobLog.text };
      if (jobLog.error && isPendingLogMessage(jobLog.error)) {
        return { error: jobLog.error, status: 'pending', text: '' };
      }
      if (jobLog.error) return { error: jobLog.error, status: 'error', text: '' };
    }

    return isPendingLogMessage(runLog.error)
      ? { error: runLog.error, status: 'pending', text: '' }
      : { error: runLog.error, status: 'error', text: '' };
  }

  return {
    ensureAvailable,
    fetchCheckLog,
    fetchChecks,
    fetchDefaultBranch,
    fetchLinkedPullRequests,
    fetchPullRequest,
    fetchRunMetadata,
    fetchTask,
  };
}
