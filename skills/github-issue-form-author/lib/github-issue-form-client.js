import runGitHubCli, {
  GITHUB_API_VERSION_HEADER,
  githubCliResultDetail,
  githubCliResultStatus,
} from '../../../lib/run-github-cli.js';
import { parseRepositoryTarget } from '../utils/parse-repository-target.js';

const TEMPLATE_DIRECTORY = '.github/ISSUE_TEMPLATE';
export const MANAGED_ISSUE_FORM_PATHS = Object.freeze([
  `${TEMPLATE_DIRECTORY}/task.yml`,
  `${TEMPLATE_DIRECTORY}/bug.yml`,
  `${TEMPLATE_DIRECTORY}/feature.yml`,
  `${TEMPLATE_DIRECTORY}/config.yml`,
]);

function parseJson(result, context) {
  try {
    return JSON.parse(String(result.stdout ?? ''));
  } catch (error) {
    throw new Error(`${context} returned invalid JSON: ${error.message}`, { cause: error });
  }
}

function notFound(result) {
  return (
    githubCliResultStatus(result) !== 0 &&
    /(?:HTTP\s+404|Not Found)/i.test(githubCliResultDetail(result))
  );
}

function failure(result, method, endpoint) {
  return {
    ok: false,
    error: `${method} ${endpoint}: ${githubCliResultDetail(result) || 'unknown error'}`,
  };
}

function contentEndpoint(slug, path, branch) {
  return `/repos/${slug}/contents/${path}?ref=${encodeURIComponent(branch)}`;
}

/** GitHub Contents API boundary for inspecting and aligning repository-local issue forms. */
export class GitHubIssueFormClient {
  #runner;

  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
  }

  #run(args, options = {}) {
    return this.#runner(args, options);
  }

  ensureAvailable() {
    const version = this.#run(['--version']);
    if (version.error?.code === 'ENOENT') {
      throw new Error('GitHub CLI (gh) is required for issue-form repository alignment.');
    }
    if (githubCliResultStatus(version) !== 0) {
      throw new Error(githubCliResultDetail(version) || 'GitHub CLI availability check failed.');
    }
    const auth = this.#run(['auth', 'status']);
    return githubCliResultStatus(auth) === 0
      ? []
      : ['GitHub CLI authentication could not be verified; repository reads or writes can fail.'];
  }

  #readFile(slug, path, branch) {
    const endpoint = contentEndpoint(slug, path, branch);
    const result = this.#run(['api', endpoint, '-H', GITHUB_API_VERSION_HEADER]);
    if (notFound(result)) return { path, status: 'missing', sha: null, content: null };
    if (githubCliResultStatus(result) !== 0) {
      return {
        path,
        status: 'unavailable',
        sha: null,
        content: null,
        error: failure(result, 'GET', endpoint).error,
      };
    }
    try {
      const payload = parseJson(result, `GET ${endpoint}`);
      if (payload.type !== 'file' || payload.encoding !== 'base64' || !payload.sha) {
        return {
          path,
          status: 'unavailable',
          sha: payload.sha ?? null,
          content: null,
          error: `GET ${endpoint} did not return a base64 file response.`,
        };
      }
      return {
        path,
        status: 'present',
        sha: payload.sha,
        content: Buffer.from(String(payload.content).replaceAll(/\s/g, ''), 'base64').toString(
          'utf8',
        ),
      };
    } catch (error) {
      return { path, status: 'unavailable', sha: null, content: null, error: error.message };
    }
  }

  inspectRepository(value) {
    const requestedTarget = parseRepositoryTarget(value?.slug ?? value);
    const repositoryEndpoint = `/repos/${requestedTarget.slug}`;
    const repositoryResult = this.#run([
      'api',
      repositoryEndpoint,
      '-H',
      GITHUB_API_VERSION_HEADER,
    ]);
    if (githubCliResultStatus(repositoryResult) !== 0) {
      throw new Error(failure(repositoryResult, 'GET', repositoryEndpoint).error);
    }
    const repository = parseJson(repositoryResult, `GET ${repositoryEndpoint}`);
    const target = parseRepositoryTarget(repository.full_name ?? requestedTarget.slug);
    const defaultBranch = String(repository.default_branch ?? '').trim();
    if (!defaultBranch) throw new Error(`Repository ${target.slug} has no default branch.`);

    const directoryEndpoint = contentEndpoint(target.slug, TEMPLATE_DIRECTORY, defaultBranch);
    const directoryResult = this.#run(['api', directoryEndpoint, '-H', GITHUB_API_VERSION_HEADER]);
    let directoryEntries = [];
    const warnings = [];
    if (!notFound(directoryResult)) {
      if (githubCliResultStatus(directoryResult) !== 0) {
        warnings.push(failure(directoryResult, 'GET', directoryEndpoint).error);
      } else {
        const payload = parseJson(directoryResult, `GET ${directoryEndpoint}`);
        if (Array.isArray(payload)) directoryEntries = payload;
        else warnings.push(`GET ${directoryEndpoint} did not return a directory listing.`);
      }
    }

    const managed = new Set(MANAGED_ISSUE_FORM_PATHS);
    const unmanagedFiles = directoryEntries
      .filter(({ path }) => !managed.has(path))
      .map(({ path, sha = null, type = 'unknown' }) => ({ path, sha, type }))
      .sort((left, right) => left.path.localeCompare(right.path));

    return {
      target,
      ownerType: repository.owner?.type ?? 'Unknown',
      defaultBranch,
      files: MANAGED_ISSUE_FORM_PATHS.map((path) =>
        this.#readFile(target.slug, path, defaultBranch),
      ),
      unmanagedFiles,
      warnings,
    };
  }

  putFile(targetValue, branch, operation) {
    const target = parseRepositoryTarget(targetValue?.slug ?? targetValue);
    const endpoint = `/repos/${target.slug}/contents/${operation.path}`;
    const payload = {
      message: operation.message,
      content: Buffer.from(operation.after.content, 'utf8').toString('base64'),
      branch,
      ...(operation.before.sha ? { sha: operation.before.sha } : {}),
    };
    const args = [
      'api',
      endpoint,
      '--method',
      'PUT',
      '-H',
      GITHUB_API_VERSION_HEADER,
      '--input',
      '-',
    ];
    const result = this.#run(args, { input: JSON.stringify(payload) });
    if (githubCliResultStatus(result) !== 0) return failure(result, 'PUT', endpoint);
    try {
      const payload = parseJson(result, `PUT ${endpoint}`);
      return {
        ok: true,
        value: {
          path: payload.content?.path ?? operation.path,
          sha: payload.content?.sha ?? null,
          commitSha: payload.commit?.sha ?? null,
        },
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }
}
