import runGitHubCli, {
  flattenGitHubPages,
  GITHUB_API_VERSION_HEADER,
} from '../../../lib/run-github-cli.js';
import { GitHubTaskClient } from '../../task-author/lib/github-task-client.js';

const SEARCH_PAGE_SIZE = 100;
const MAX_SEARCH_RESULTS = 1000;

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
    const args = ['api', endpoint, '--method', method, '-H', GITHUB_API_VERSION_HEADER];
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
        value: flattenGitHubPages(parseJson(result, `${method} ${endpoint}`)),
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
    const items = [];
    const seenIds = new Set();
    let total = null;

    for (let page = 1; page <= MAX_SEARCH_RESULTS / SEARCH_PAGE_SIZE; page += 1) {
      const result = this.#request(
        'GET',
        `/search/issues?q=${query}&per_page=${SEARCH_PAGE_SIZE}&page=${page}`,
      );
      if (!result.ok) return result;
      const payload = result.value;
      if (
        !Array.isArray(payload?.items) ||
        !Number.isInteger(payload.total_count) ||
        payload.total_count < 0 ||
        payload.incomplete_results !== false
      ) {
        return { ok: false, error: 'Child title search did not return complete search evidence.' };
      }
      if (payload.total_count > MAX_SEARCH_RESULTS) {
        return {
          ok: false,
          error: `Child title search exceeds the ${MAX_SEARCH_RESULTS}-result inspection limit.`,
        };
      }
      total ??= payload.total_count;
      if (payload.total_count !== total || payload.items.length > SEARCH_PAGE_SIZE) {
        return {
          ok: false,
          error: 'Child title search changed while reading pages; retry inspection.',
        };
      }
      for (const item of payload.items) {
        if (!Number.isInteger(item?.id) || seenIds.has(item.id)) {
          return {
            ok: false,
            error: 'Child title search returned invalid or repeated results; retry inspection.',
          };
        }
        seenIds.add(item.id);
        items.push(item);
      }
      if (items.length === total) return { ok: true, value: items };
      if (items.length > total || payload.items.length < SEARCH_PAGE_SIZE) break;
    }
    return { ok: false, error: 'Child title search ended before all results were inspected.' };
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
