import runGitHubCli from '../../../lib/run-github-cli.js';

function defaultCommandRunner(command, args) {
  if (command !== 'gh') throw new Error('GitHub CLI command must be bare gh.');
  const result = runGitHubCli(args);
  return {
    error: result.error ?? null,
    returncode: result.status ?? 1,
    stderr: String(result.stderr ?? ''),
    stdout: String(result.stdout ?? ''),
  };
}

function errorMessage(result, fallback) {
  return (result.stderr || result.stdout || '').trim() || fallback;
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

function flattenPages(pages) {
  if (!Array.isArray(pages)) throw new Error('unexpected repository issue JSON shape.');
  return pages.every(Array.isArray) ? pages.flat() : pages;
}

/**
 * Creates a read-only GitHub milestone-planning client with an injectable bare-gh boundary.
 *
 * @param {object} [options] Client dependencies.
 * @param {Function} [options.runner=defaultCommandRunner] Command execution boundary.
 * @returns {object} Repository, milestone, issue, and pull-request inspection operations.
 */
export function createGitHubMilestonePlannerClient({ runner = defaultCommandRunner } = {}) {
  const runGh = (args) => runner('gh', args);

  function ensureAvailable() {
    const versionResult = runGh(['--version']);
    if (versionResult.error || versionResult.returncode !== 0) {
      return { message: 'gh is not installed or not on PATH.', ok: false };
    }

    const authResult = runGh(['auth', 'status']);
    return authResult.returncode === 0
      ? { authenticated: true, ok: true }
      : {
          authenticated: false,
          message: errorMessage(
            authResult,
            'gh is not authenticated; public reads may still work.',
          ),
          ok: true,
        };
  }

  function fetchRepository(target) {
    const result = runGh([
      'repo',
      'view',
      target.slug,
      '--json',
      'nameWithOwner,description,defaultBranchRef,url',
    ]);
    if (result.returncode !== 0) {
      throw new Error(errorMessage(result, `unable to inspect repository ${target.slug}.`));
    }
    return parseJson(
      result,
      'unable to parse repository JSON.',
      'unexpected repository JSON shape.',
      (data) => data && typeof data === 'object' && !Array.isArray(data),
    );
  }

  function fetchMilestone(target) {
    const result = runGh([
      'api',
      '--method',
      'GET',
      `repos/${target.owner}/${target.repo}/milestones/${target.number}`,
    ]);
    if (result.returncode !== 0) {
      throw new Error(
        errorMessage(result, `unable to inspect milestone ${target.slug}#${target.number}.`),
      );
    }
    return parseJson(
      result,
      'unable to parse milestone JSON.',
      'unexpected milestone JSON shape.',
      (data) => data && typeof data === 'object' && !Array.isArray(data),
    );
  }

  function fetchIssueLikeItems(target) {
    const result = runGh([
      'api',
      '--method',
      'GET',
      '--paginate',
      '--slurp',
      `repos/${target.owner}/${target.repo}/issues`,
      '-f',
      'state=all',
      '-f',
      'per_page=100',
    ]);
    if (result.returncode !== 0) {
      throw new Error(errorMessage(result, `unable to inspect tasks for ${target.slug}.`));
    }
    const pages = parseJson(
      result,
      'unable to parse repository issue JSON.',
      'unexpected repository issue JSON shape.',
      Array.isArray,
    );
    return flattenPages(pages);
  }

  return { ensureAvailable, fetchIssueLikeItems, fetchMilestone, fetchRepository };
}
