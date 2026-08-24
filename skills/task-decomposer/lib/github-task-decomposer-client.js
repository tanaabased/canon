import runGitHubCli from '../../../lib/run-github-cli.js';
import { GitHubTaskClient } from '../../task-author/lib/github-task-client.js';

const API_VERSION = '2026-03-10';

function failureMessage(result, context) {
  const detail =
    String(result.stderr ?? '').trim() ||
    String(result.error?.message ?? '').trim() ||
    String(result.stdout ?? '').trim() ||
    'unknown error';
  return `${context}: ${detail}`;
}

function parseJson(result, context) {
  try {
    return JSON.parse(String(result.stdout || 'null'));
  } catch (error) {
    throw new Error(`${context} returned invalid JSON: ${error.message}`, { cause: error });
  }
}

function flattenPages(value) {
  if (!Array.isArray(value)) return value;
  return value.every(Array.isArray) ? value.flat() : value;
}

/**
 * Narrow GitHub boundary for inspecting and materializing one shallow task decomposition.
 *
 * Every request uses the host-routed bare gh command. Structured mutation payloads are
 * supplied through standard input so task text never appears in command arguments.
 */
export class GitHubTaskDecomposerClient {
  #repositoryCache = new Map();
  #runner;
  #tasks;

  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
    this.#tasks = new GitHubTaskClient({ runner });
  }

  ensureAvailable() {
    return this.#tasks.ensureAvailable();
  }

  resolveCurrentRepository() {
    return this.#tasks.resolveCurrentRepository();
  }

  inspectRepository(target) {
    if (!this.#repositoryCache.has(target.slug)) {
      this.#repositoryCache.set(target.slug, this.#tasks.inspectRepository(target));
    }
    return this.#repositoryCache.get(target.slug);
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

    const result = this.#runner(args, options);
    if (result.status !== 0) {
      return { ok: false, error: failureMessage(result, `${method} ${endpoint}`) };
    }

    try {
      return {
        ok: true,
        value: flattenPages(parseJson(result, `${method} ${endpoint}`)),
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  readIssue(target, issueNumber) {
    return this.#tasks.readIssue(target, issueNumber);
  }

  readIssueFieldValues(target, issueNumber) {
    return this.#tasks.readIssueFieldValues(target, issueNumber);
  }

  readComments(target, issueNumber) {
    return this.#tasks.readComments(target, issueNumber);
  }

  readTimeline(target, issueNumber) {
    return this.#request(
      'GET',
      `/repos/${target.slug}/issues/${issueNumber}/timeline?per_page=100`,
      null,
      { paginate: true },
    );
  }

  readParent(target, issueNumber) {
    return this.#request('GET', `/repos/${target.slug}/issues/${issueNumber}/parent`);
  }

  listSubIssues(target, issueNumber) {
    return this.#request(
      'GET',
      `/repos/${target.slug}/issues/${issueNumber}/sub_issues?per_page=100`,
      null,
      { paginate: true },
    );
  }

  listBlockedBy(target, issueNumber) {
    return this.#request(
      'GET',
      `/repos/${target.slug}/issues/${issueNumber}/dependencies/blocked_by?per_page=100`,
      null,
      { paginate: true },
    );
  }

  listBlocking(target, issueNumber) {
    return this.#request(
      'GET',
      `/repos/${target.slug}/issues/${issueNumber}/dependencies/blocking?per_page=100`,
      null,
      { paginate: true },
    );
  }

  listRepositoryIssues(target) {
    return this.#request(
      'GET',
      `/repos/${target.slug}/issues?state=all&sort=updated&direction=desc&per_page=100`,
    );
  }

  searchIssuesByTitle(target, title) {
    const escapedTitle = String(title).replaceAll('"', '\\"');
    const query = encodeURIComponent(`repo:${target.slug} is:issue in:title "${escapedTitle}"`);
    const result = this.#request('GET', `/search/issues?q=${query}&per_page=100`);
    if (!result.ok) return result;
    return {
      ok: true,
      value: Array.isArray(result.value?.items) ? result.value.items : [],
    };
  }

  createIssue(target, payload) {
    return this.#tasks.createIssue(target, payload);
  }

  updateIssue(target, issueNumber, payload) {
    return this.#tasks.updateIssue(target, issueNumber, payload);
  }

  addComment(target, issueNumber, body) {
    return this.#tasks.addComment(target, issueNumber, body);
  }

  addSubIssue(target, parentNumber, subIssueId) {
    return this.#request('POST', `/repos/${target.slug}/issues/${parentNumber}/sub_issues`, {
      sub_issue_id: subIssueId,
    });
  }

  addBlockedBy(target, issueNumber, blockingIssueId) {
    return this.#request(
      'POST',
      `/repos/${target.slug}/issues/${issueNumber}/dependencies/blocked_by`,
      { issue_id: blockingIssueId },
    );
  }
}
