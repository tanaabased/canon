import { GitHubCapabilityClient } from './github-capability-client.js';
import runGitHubCli from '../../../lib/run-github-cli.js';

const API_VERSION = '2026-03-10';

function flattenPages(value) {
  if (!Array.isArray(value)) return value;
  return value.every(Array.isArray) ? value.flat() : value;
}

function parseResult(result, context) {
  if (result.status !== 0) {
    const detail =
      String(result.stderr ?? '').trim() ||
      String(result.error?.message ?? '').trim() ||
      String(result.stdout ?? '').trim() ||
      'unknown error';
    return { ok: false, error: `${context}: ${detail}` };
  }
  try {
    return { ok: true, value: flattenPages(JSON.parse(String(result.stdout || 'null'))) };
  } catch (error) {
    return { ok: false, error: `${context} returned invalid JSON: ${error.message}` };
  }
}

/** GitHub task read/write boundary with capability reads delegated to the existing client. */
export class GitHubTaskClient {
  #capabilities;
  #runner;

  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
    this.#capabilities = new GitHubCapabilityClient({ runner });
  }

  ensureAvailable() {
    return this.#capabilities.ensureAvailable();
  }

  resolveCurrentRepository() {
    return this.#capabilities.resolveCurrentRepository();
  }

  inspectRepository(target) {
    return this.#capabilities.inspectRepository(target);
  }

  #request(method, endpoint, payload = null, { paginate = false } = {}) {
    const args = [
      'api',
      endpoint,
      '--method',
      method,
      '-H',
      `X-GitHub-Api-Version: ${API_VERSION}`,
    ];
    const options = {};
    if (paginate) args.push('--paginate', '--slurp');
    if (payload !== null) {
      args.push('--input', '-');
      options.input = JSON.stringify(payload);
    }
    return parseResult(this.#runner(args, options), `${method} ${endpoint}`);
  }

  createIssue(target, payload) {
    return this.#request('POST', `/repos/${target.slug}/issues`, payload);
  }

  updateIssue(target, issueNumber, payload) {
    return this.#request('PATCH', `/repos/${target.slug}/issues/${issueNumber}`, payload);
  }

  addComment(target, issueNumber, body) {
    return this.#request('POST', `/repos/${target.slug}/issues/${issueNumber}/comments`, { body });
  }

  readIssue(target, issueNumber) {
    return this.#request('GET', `/repos/${target.slug}/issues/${issueNumber}`);
  }

  readIssueFieldValues(target, issueNumber) {
    return this.#request(
      'GET',
      `/repos/${target.slug}/issues/${issueNumber}/issue-field-values?per_page=100`,
      null,
      { paginate: true },
    );
  }

  readComments(target, issueNumber) {
    return this.#request(
      'GET',
      `/repos/${target.slug}/issues/${issueNumber}/comments?per_page=100`,
      null,
      { paginate: true },
    );
  }
}
