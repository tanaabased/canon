import { spawnSync } from 'node:child_process';

const PENDING_LOG_MARKERS = ['still in progress', 'log will be available when it is complete'];

function defaultCommandRunner(command, args, cwd, { raw = false } = {}) {
  const result = spawnSync(command, args, { cwd, encoding: raw ? undefined : 'utf8' });
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

function parseAvailableFields(message) {
  if (!message.includes('Available fields:')) return [];
  const lines = message.split('\n');
  const markerIndex = lines.findIndex((line) => line.includes('Available fields:'));
  return lines
    .slice(markerIndex + 1)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPendingLogMessage(message) {
  const lowered = String(message).toLowerCase();
  return PENDING_LOG_MARKERS.some((marker) => lowered.includes(marker));
}

/**
 * Creates a GitHub command client whose process boundary can be replaced by a
 * deterministic fake runner.
 *
 * @param {object} [options] Client dependencies.
 * @param {Function} [options.runner=defaultCommandRunner] Command execution boundary.
 * @returns {object} Git and GitHub inspection operations.
 */
export function createGitHubChecksClient({ runner = defaultCommandRunner } = {}) {
  const run = (command, args, cwd, options) => runner(command, args, cwd, options);
  const runGh = (args, cwd, options) => run('gh', args, cwd, options);

  function findGitRoot(start) {
    const result = run('git', ['rev-parse', '--show-toplevel'], start);
    return result.error || result.returncode !== 0 ? null : result.stdout.trim() || null;
  }

  function ensureAvailable(repoRoot) {
    const versionResult = runGh(['--version'], repoRoot);
    if (versionResult.error) {
      return { message: 'gh is not installed or not on PATH.', ok: false };
    }

    const authResult = runGh(['auth', 'status'], repoRoot);
    return authResult.returncode === 0
      ? { ok: true }
      : { message: errorMessage(authResult, 'gh not authenticated.'), ok: false };
  }

  function resolvePr(prValue, repoRoot) {
    if (prValue) return String(prValue);
    const result = runGh(['pr', 'view', '--json', 'number'], repoRoot);
    if (result.returncode !== 0) throw new Error(errorMessage(result, 'unable to resolve PR.'));

    let data;
    try {
      data = JSON.parse(result.stdout || '{}');
    } catch {
      throw new Error('unable to parse PR JSON.');
    }
    if (!data?.number) throw new Error('no PR number found.');
    return String(data.number);
  }

  function fetchChecks(prValue, repoRoot) {
    const primaryFields = ['name', 'state', 'conclusion', 'detailsUrl', 'startedAt', 'completedAt'];
    let result = runGh(['pr', 'checks', prValue, '--json', primaryFields.join(',')], repoRoot);

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

      result = runGh(['pr', 'checks', prValue, '--json', fallbackFields.join(',')], repoRoot);
      if (result.returncode !== 0) throw new Error(errorMessage(result, 'gh pr checks failed.'));
    }

    let data;
    try {
      data = JSON.parse(result.stdout || '[]');
    } catch {
      throw new Error('unable to parse checks JSON.');
    }
    if (!Array.isArray(data)) throw new Error('unexpected checks JSON shape.');
    return data;
  }

  function fetchRunMetadata(runId, repoRoot) {
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
    const result = runGh(['run', 'view', runId, '--json', fields.join(',')], repoRoot);
    if (result.returncode !== 0) return null;
    try {
      const data = JSON.parse(result.stdout || '{}');
      return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }

  function fetchRunLog(runId, repoRoot) {
    const result = runGh(['run', 'view', runId, '--log'], repoRoot);
    return result.returncode === 0
      ? { error: '', text: result.stdout }
      : { error: errorMessage(result, 'gh run view failed'), text: '' };
  }

  function fetchJobLog(jobId, repoRoot) {
    const repoResult = runGh(['repo', 'view', '--json', 'nameWithOwner'], repoRoot);
    if (repoResult.returncode !== 0) {
      return { error: 'Error: unable to resolve repository name for job logs.', text: '' };
    }

    let repoSlug;
    try {
      repoSlug = JSON.parse(repoResult.stdout || '{}')?.nameWithOwner;
    } catch {
      repoSlug = null;
    }
    if (!repoSlug) {
      return { error: 'Error: unable to resolve repository name for job logs.', text: '' };
    }

    const result = runGh(['api', `/repos/${repoSlug}/actions/jobs/${jobId}/logs`], repoRoot, {
      raw: true,
    });
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

  function fetchCheckLog({ runId, jobId, repoRoot }) {
    const runLog = fetchRunLog(runId, repoRoot);
    if (!runLog.error) return { error: '', status: 'ok', text: runLog.text };

    if (isPendingLogMessage(runLog.error) && jobId) {
      const jobLog = fetchJobLog(jobId, repoRoot);
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
    fetchRunMetadata,
    findGitRoot,
    resolvePr,
  };
}
