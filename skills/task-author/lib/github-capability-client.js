import runGitHubCli from '../../../lib/run-github-cli.js';

const API_VERSION = '2026-03-10';

function commandFailure(result, context) {
  const detail = String(result.stderr ?? result.error?.message ?? 'unknown error').trim();
  return new Error(`${context}: ${detail}`);
}

function parseJson(result, context) {
  try {
    return JSON.parse(String(result.stdout));
  } catch (error) {
    throw new Error(`${context} returned invalid JSON: ${error.message}`, { cause: error });
  }
}

function flattenCollection(payload, keys = []) {
  const pages = Array.isArray(payload) ? payload : [payload];
  return pages.flatMap((page) => {
    if (Array.isArray(page)) return page;
    for (const key of keys) {
      if (Array.isArray(page?.[key])) return page[key];
    }
    return [];
  });
}

/** Read-only GitHub capability discovery with an injected command runner for tests. */
export class GitHubCapabilityClient {
  #runner;

  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
  }

  #run(args) {
    return this.#runner(args);
  }

  ensureAvailable() {
    const version = this.#run(['--version']);
    if (version.error?.code === 'ENOENT') {
      throw new Error('GitHub CLI (gh) is required for repository capability discovery.');
    }
    if (version.status !== 0) throw commandFailure(version, 'GitHub CLI availability check failed');

    const auth = this.#run(['auth', 'status']);
    return auth.status === 0
      ? []
      : [
          'GitHub CLI authentication could not be verified; public reads may still succeed, but private repository discovery can fail.',
        ];
  }

  resolveCurrentRepository() {
    const result = this.#run(['repo', 'view', '--json', 'nameWithOwner']);
    if (result.status !== 0) return null;
    const payload = parseJson(result, 'Current repository discovery');
    return payload.nameWithOwner ?? null;
  }

  getJson(endpoint, { paginate = false, keys = [] } = {}) {
    const args = ['api', endpoint, '-H', `X-GitHub-Api-Version: ${API_VERSION}`];
    if (paginate) args.push('--paginate', '--slurp');
    const result = this.#run(args);
    if (result.status !== 0) return { ok: false, error: commandFailure(result, `GET ${endpoint}`) };

    try {
      const payload = parseJson(result, `GET ${endpoint}`);
      return { ok: true, value: paginate ? flattenCollection(payload, keys) : payload };
    } catch (error) {
      return { ok: false, error };
    }
  }

  inspectRepository(target) {
    const warnings = [];
    const repositoryRead = this.getJson(`/repos/${target.slug}`);
    if (!repositoryRead.ok) throw repositoryRead.error;

    const repository = repositoryRead.value;
    const ownerType = String(repository.owner?.type ?? '').toLowerCase();
    const organizationOwned = ownerType === 'organization';
    const issueTypes = organizationOwned
      ? this.optionalCollection(
          `/repos/${target.slug}/issue-types`,
          ['issue_types', 'issueTypes'],
          'repository issue types',
          warnings,
        )
      : { status: 'not_applicable', values: [] };
    const issueFields = organizationOwned
      ? this.optionalCollection(
          `/orgs/${target.owner}/issue-fields?per_page=100`,
          ['fields', 'issue_fields'],
          'organization issue fields',
          warnings,
        )
      : { status: 'not_applicable', values: [] };
    const labels = this.optionalCollection(
      `/repos/${target.slug}/labels?per_page=100`,
      ['labels'],
      'repository labels',
      warnings,
    );

    return {
      repository: {
        slug: target.slug,
        ownerLogin: repository.owner?.login ?? target.owner,
        ownerType: repository.owner?.type ?? 'Unknown',
        private: Boolean(repository.private),
      },
      issueTypes,
      issueFields,
      labels,
      warnings,
    };
  }

  optionalCollection(endpoint, keys, description, warnings) {
    const result = this.getJson(endpoint, { paginate: true, keys });
    if (result.ok) return { status: 'ok', values: result.value };
    warnings.push(`Could not inspect ${description}: ${result.error.message}`);
    return { status: 'unavailable', values: [] };
  }
}
