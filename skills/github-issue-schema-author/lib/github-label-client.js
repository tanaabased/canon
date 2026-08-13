import { spawnSync } from 'node:child_process';

import { GitHubSchemaClient } from './github-schema-client.js';

const API_VERSION = '2026-03-10';

function defaultRunner(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

/** GitHub boundary for repository-label reads, creates, and definition-only updates. */
export class GitHubLabelClient {
  #reader;
  #runner;

  constructor({ runner = defaultRunner } = {}) {
    this.#runner = runner;
    this.#reader = new GitHubSchemaClient({ runner });
  }

  ensureAvailable() {
    return this.#reader.ensureAvailable();
  }

  inspect(target) {
    return this.#reader.inspect(target);
  }

  #request(method, endpoint, payload) {
    const result = this.#runner(
      'gh',
      [
        'api',
        endpoint,
        '--method',
        method,
        '-H',
        `X-GitHub-Api-Version: ${API_VERSION}`,
        '--input',
        '-',
      ],
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
