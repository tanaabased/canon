import { GitHubCapabilityClient } from './github-capability-client.js';
import runGitHubCli from '../../../lib/run-github-cli.js';

const API_VERSION = '2026-03-10';

function parseResult(result, context) {
  if (result.status !== 0) {
    const detail = String(result.stderr ?? result.error?.message ?? 'unknown error').trim();
    return { ok: false, error: `${context}: ${detail}` };
  }
  try {
    return { ok: true, value: JSON.parse(String(result.stdout)) };
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

  #request(method, endpoint, payload = null) {
    const args = [
      'api',
      endpoint,
      '--method',
      method,
      '-H',
      `X-GitHub-Api-Version: ${API_VERSION}`,
    ];
    const options = {};
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
    );
  }

  readComments(target, issueNumber) {
    return this.#request(
      'GET',
      `/repos/${target.slug}/issues/${issueNumber}/comments?per_page=100`,
    );
  }
}
