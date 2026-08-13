import { spawnSync } from 'node:child_process';

import { GitHubSchemaClient } from './github-schema-client.js';

const API_VERSION = '2026-03-10';

function defaultRunner(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function resultStatus(result) {
  return result.returncode ?? result.status ?? 1;
}

function resultDetail(result) {
  return String(result.stderr ?? result.error?.message ?? result.stdout ?? '').trim();
}

function parseJson(result, method, endpoint) {
  try {
    return { ok: true, value: JSON.parse(String(result.stdout)) };
  } catch (error) {
    return { ok: false, error: `${method} ${endpoint} returned invalid JSON: ${error.message}` };
  }
}

function normalizeField(field) {
  return {
    id: field.id,
    nodeId: field.node_id ?? null,
    name: field.name,
    description: field.description ?? '',
    dataType: String(field.data_type ?? '').toLowerCase(),
    visibility: field.visibility,
    options: [...(field.options ?? [])]
      .sort((left, right) => left.priority - right.priority)
      .map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description ?? '',
        color: String(option.color ?? 'gray').toLowerCase(),
        priority: option.priority,
      })),
  };
}

/** GitHub boundary for organization issue-field reads and the two supported REST mutations. */
export class GitHubIssueFieldClient {
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
    const args = ['api', endpoint];
    const options = {};
    if (method !== 'GET') {
      args.push('--method', method, '-H', `X-GitHub-Api-Version: ${API_VERSION}`, '--input', '-');
      options.input = JSON.stringify(payload);
    } else {
      args.push('-H', `X-GitHub-Api-Version: ${API_VERSION}`);
    }
    const result = this.#runner('gh', args, options);
    if (resultStatus(result) !== 0) {
      return {
        ok: false,
        error: `${method} ${endpoint}: ${resultDetail(result) || 'unknown error'}`,
      };
    }
    return parseJson(result, method, endpoint);
  }

  listIssueFields(organization) {
    const endpoint = `/orgs/${organization}/issue-fields`;
    const result = this.#request('GET', endpoint);
    if (!result.ok) return result;
    if (!Array.isArray(result.value)) {
      return { ok: false, error: `GET ${endpoint} returned a non-array response.` };
    }
    return { ok: true, value: result.value.map(normalizeField) };
  }

  createIssueField(organization, payload) {
    return this.#request('POST', `/orgs/${organization}/issue-fields`, payload);
  }

  recolorIssueField(organization, fieldId, options) {
    return this.#request('PATCH', `/orgs/${organization}/issue-fields/${fieldId}`, { options });
  }

  updateIssueFieldVisibility(organization, fieldId, visibility) {
    return this.#request('PATCH', `/orgs/${organization}/issue-fields/${fieldId}`, {
      visibility,
    });
  }
}
