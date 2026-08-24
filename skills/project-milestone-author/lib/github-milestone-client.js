import runGitHubCli from '../../../lib/run-github-cli.js';

const API_VERSION = '2026-03-10';

function parseResult(result, context) {
  if (result.status !== 0) {
    const detail = String(result.stderr || result.error?.message || 'unknown error').trim();
    return { ok: false, error: `${context}: ${detail}` };
  }
  try {
    return { ok: true, value: JSON.parse(String(result.stdout)) };
  } catch (error) {
    return { ok: false, error: `${context} returned invalid JSON: ${error.message}` };
  }
}

function flattenedPages(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((page) => (Array.isArray(page) ? page : []));
}

/** Narrow GitHub milestone and task-membership API boundary. */
export class GitHubMilestoneClient {
  #runner;

  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
  }

  ensureAvailable() {
    const version = this.#runner(['--version']);
    if (version.error?.code === 'ENOENT') {
      throw new Error('GitHub CLI (gh) is required for project milestone authoring.');
    }
    if (version.status !== 0) {
      const detail = String(
        version.stderr || version.error?.message || 'unknown GitHub CLI failure',
      ).trim();
      throw new Error(`GitHub CLI availability check failed: ${detail}`);
    }
    const auth = this.#runner(['auth', 'status']);
    return auth.status === 0
      ? []
      : [
          'GitHub CLI authentication could not be verified; public reads may still work, but private repository access and writes can fail.',
        ];
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
    const parsed = parseResult(this.#runner(args, options), `${method} ${endpoint}`);
    if (!parsed.ok || !paginate) return parsed;
    return { ok: true, value: flattenedPages(parsed.value) };
  }

  readRepository(slug) {
    return this.#request('GET', `/repos/${slug}`);
  }

  listMilestones(slug) {
    return this.#request('GET', `/repos/${slug}/milestones?state=all&per_page=100`, null, {
      paginate: true,
    });
  }

  readMilestone(slug, number) {
    return this.#request('GET', `/repos/${slug}/milestones/${number}`);
  }

  createMilestone(slug, payload) {
    return this.#request('POST', `/repos/${slug}/milestones`, payload);
  }

  updateMilestone(slug, number, payload) {
    return this.#request('PATCH', `/repos/${slug}/milestones/${number}`, payload);
  }

  listMilestoneMembers(slug, number) {
    return this.#request(
      'GET',
      `/repos/${slug}/issues?milestone=${number}&state=all&per_page=100`,
      null,
      { paginate: true },
    );
  }

  readTask(slug, number) {
    return this.#request('GET', `/repos/${slug}/issues/${number}`);
  }

  updateTaskMilestone(slug, number, milestoneNumber) {
    return this.#request('PATCH', `/repos/${slug}/issues/${number}`, {
      milestone: milestoneNumber,
    });
  }
}
