import { spawnSync } from 'node:child_process';

import { GitHubSchemaClient } from './github-schema-client.js';

const API_VERSION = '2026-03-10';

function defaultRunner(command, args) {
  return spawnSync(command, args, { encoding: 'utf8' });
}

function resultStatus(result) {
  return result.returncode ?? result.status ?? 1;
}

function failure(result, method, endpoint) {
  const detail = String(result.stderr ?? result.error?.message ?? result.stdout ?? '').trim();
  return { ok: false, error: `${method} ${endpoint}: ${detail || 'unknown error'}` };
}

/** Read boundary for resolving numeric field IDs used by GitHub's settings UI. */
export class GitHubFieldPinningClient {
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

  listIssueFields(organization) {
    const endpoint = `/orgs/${organization}/issue-fields`;
    const result = this.#runner('gh', [
      'api',
      endpoint,
      '-H',
      `X-GitHub-Api-Version: ${API_VERSION}`,
    ]);
    if (resultStatus(result) !== 0) return failure(result, 'GET', endpoint);
    try {
      const fields = JSON.parse(String(result.stdout));
      if (!Array.isArray(fields)) {
        return { ok: false, error: `GET ${endpoint} returned a non-array response.` };
      }
      return {
        ok: true,
        value: fields.map((field) => ({ id: field.id, nodeId: field.node_id, name: field.name })),
      };
    } catch (error) {
      return { ok: false, error: `GET ${endpoint} returned invalid JSON: ${error.message}` };
    }
  }
}
