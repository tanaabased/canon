import runGitHubCli, {
  GITHUB_API_VERSION_HEADER,
  githubCliResultDetail,
  githubCliResultStatus,
} from '../../../lib/run-github-cli.js';
import { GitHubSchemaClient } from './github-schema-client.js';

const PERSONAL_FIELDS_ENDPOINT = '/user/issue-fields';

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

function completeField(field) {
  return (
    Number.isSafeInteger(field?.id) &&
    typeof field.name === 'string' &&
    field.name.trim() !== '' &&
    typeof field.data_type === 'string' &&
    typeof field.visibility === 'string' &&
    (!field.data_type.endsWith('_select') ||
      (Array.isArray(field.options) &&
        field.options.every(
          (option) =>
            typeof option?.name === 'string' &&
            typeof option.color === 'string' &&
            Number.isSafeInteger(option.priority),
        )))
  );
}

/** GitHub REST boundary for additive fields and organization field updates. */
export class GitHubIssueFieldClient {
  #reader;
  #runner;

  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
    this.#reader = new GitHubSchemaClient({ runner });
  }

  ensureAvailable() {
    return this.#reader.ensureAvailable();
  }

  inspect(target) {
    return this.#reader.inspect(target);
  }

  #request(method, endpoint, payload, { paginate = false } = {}) {
    const args = ['api', endpoint];
    const options = {};
    if (method !== 'GET') {
      args.push('--method', method, '-H', GITHUB_API_VERSION_HEADER, '--input', '-');
      options.input = JSON.stringify(payload);
    } else {
      args.push('-H', GITHUB_API_VERSION_HEADER);
      if (paginate) args.push('--paginate', '--slurp');
    }
    const result = this.#runner(args, options);
    if (githubCliResultStatus(result) !== 0) {
      return {
        ok: false,
        error: `${method} ${endpoint}: ${githubCliResultDetail(result) || 'unknown error'}`,
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

  #verifyPersonalAccount({ login, id }) {
    const result = this.#request('GET', '/user');
    if (!result.ok) return result;
    const account = result.value;
    if (
      typeof account?.login !== 'string' ||
      account.login.toLowerCase() !== login.toLowerCase() ||
      !Number.isSafeInteger(account.id) ||
      (id !== undefined && account.id !== id)
    ) {
      return { ok: false, error: `The authenticated GitHub account must be ${login}.` };
    }
    return { ok: true, account: { login: account.login, id: account.id } };
  }

  listPersonalIssueFields(owner) {
    const identity = this.#verifyPersonalAccount(owner);
    if (!identity.ok) return identity;
    const result = this.#request('GET', PERSONAL_FIELDS_ENDPOINT, undefined, { paginate: true });
    if (!result.ok) return { ...result, account: identity.account };
    const pages = result.value;
    if (
      !Array.isArray(pages) ||
      pages.length === 0 ||
      !pages.every((page) => Array.isArray(page) && page.every(completeField))
    ) {
      return {
        ok: false,
        account: identity.account,
        error: `GET ${PERSONAL_FIELDS_ENDPOINT} returned an incomplete field inventory.`,
      };
    }
    return { ...identity, value: pages.flat().map(normalizeField) };
  }

  createPersonalIssueField(account, payload) {
    const identity = this.#verifyPersonalAccount(account);
    if (!identity.ok) return identity;
    return this.#request('POST', PERSONAL_FIELDS_ENDPOINT, payload);
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
