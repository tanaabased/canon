import { spawnSync } from 'node:child_process';

import { GitHubSchemaClient } from './github-schema-client.js';

const API_VERSION = '2026-03-10';

function defaultRunner(command, args, options = {}) {
  return spawnSync(command, args, { encoding: 'utf8', ...options });
}

function resultStatus(result) {
  return result.returncode ?? result.status ?? 1;
}

function failure(result, method, endpoint) {
  const detail = String(result.stderr ?? result.error?.message ?? result.stdout ?? '').trim();
  return { ok: false, error: `${method} ${endpoint}: ${detail || 'unknown error'}` };
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

/** GitHub boundary for reading organization fields and replacing only retained option colors. */
export class GitHubFieldColorClient {
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
    const parsed = parseJson(result, 'GET', endpoint);
    if (!parsed.ok) return parsed;
    if (!Array.isArray(parsed.value)) {
      return { ok: false, error: `GET ${endpoint} returned a non-array response.` };
    }
    return { ok: true, value: parsed.value.map(normalizeField) };
  }

  recolorIssueField(organization, fieldId, options) {
    const endpoint = `/orgs/${organization}/issue-fields/${fieldId}`;
    const result = this.#runner(
      'gh',
      [
        'api',
        endpoint,
        '--method',
        'PATCH',
        '-H',
        `X-GitHub-Api-Version: ${API_VERSION}`,
        '--input',
        '-',
      ],
      { input: JSON.stringify({ options }) },
    );
    if (resultStatus(result) !== 0) return failure(result, 'PATCH', endpoint);
    return parseJson(result, 'PATCH', endpoint);
  }
}
