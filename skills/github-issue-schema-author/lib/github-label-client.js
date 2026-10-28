import runGitHubCli, {
  GITHUB_API_VERSION_HEADER,
  githubCliResultDetail,
  githubCliResultStatus,
} from '../../../lib/run-github-cli.js';
import { GitHubSchemaClient } from './github-schema-client.js';

/** GitHub boundary for repository-label reads, creates, and definition-only updates. */
export class GitHubLabelClient {
  #reader;
  #runner;

  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
    this.#reader = new GitHubSchemaClient({ runner });
  }

  ensureAvailable() {
    return this.#reader.ensureAvailable();
  }

  inspect(target) {
    return this.#reader.inspect(target);
  }

  listOrganizationRepositories(organization) {
    const result = this.#runner([
      'api',
      `/orgs/${organization}/repos?type=all&per_page=100`,
      '--paginate',
      '--slurp',
      '-H',
      GITHUB_API_VERSION_HEADER,
    ]);
    if (githubCliResultStatus(result) !== 0) {
      throw new Error(`Repository inventory failed: ${githubCliResultDetail(result)}`);
    }
    const pages = JSON.parse(String(result.stdout));
    if (!Array.isArray(pages) || !pages.every(Array.isArray)) {
      throw new Error('Repository inventory returned an invalid page collection.');
    }
    return pages.flat();
  }

  #request(method, endpoint, payload) {
    const result = this.#runner(
      ['api', endpoint, '--method', method, '-H', GITHUB_API_VERSION_HEADER, '--input', '-'],
      { input: JSON.stringify(payload) },
    );
    if ((result.returncode ?? result.status ?? 1) !== 0) {
      return {
        ok: false,
        error: `${method} ${endpoint}: ${String(result.stderr ?? result.error?.message ?? '').trim() || 'unknown error'}`,
      };
    }
    try {
      return { ok: true, value: JSON.parse(String(result.stdout)) };
    } catch (error) {
      return { ok: false, error: `${method} ${endpoint} returned invalid JSON: ${error.message}` };
    }
  }

  createLabel(target, payload) {
    return this.#request('POST', `/repos/${target.slug}/labels`, payload);
  }

  updateLabel(target, name, payload) {
    return this.#request(
      'PATCH',
      `/repos/${target.slug}/labels/${encodeURIComponent(name)}`,
      payload,
    );
  }
}
