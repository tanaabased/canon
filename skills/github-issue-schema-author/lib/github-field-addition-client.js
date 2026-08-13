import { spawnSync } from 'node:child_process';

import { GitHubSchemaClient } from './github-schema-client.js';

const API_VERSION = '2026-03-10';

function defaultRunner(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function resultStatus(result) {
  return result.returncode ?? result.status ?? 1;
}

/** Additive organization issue-field boundary; inspection remains delegated to the read-only client. */
export class GitHubFieldAdditionClient {
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

  createIssueField(organization, payload) {
    const endpoint = `/orgs/${organization}/issue-fields`;
    const result = this.#runner(
      'gh',
      [
        'api',
        endpoint,
        '--method',
        'POST',
        '-H',
        `X-GitHub-Api-Version: ${API_VERSION}`,
        '--input',
        '-',
      ],
      { input: JSON.stringify(payload) },
    );
    if (resultStatus(result) !== 0) {
      const detail = String(result.stderr ?? result.error?.message ?? result.stdout ?? '').trim();
      return { ok: false, error: `POST ${endpoint}: ${detail || 'unknown error'}` };
    }
    try {
      return { ok: true, value: JSON.parse(String(result.stdout)) };
    } catch (error) {
      return { ok: false, error: `POST ${endpoint} returned invalid JSON: ${error.message}` };
    }
  }
}
