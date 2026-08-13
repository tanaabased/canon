import { spawnSync } from 'node:child_process';

export const SCHEMA_INSPECTION_QUERY = `
  query SchemaInspection($owner: String!, $repo: String!, $labelCursor: String) {
    organization(login: $owner) {
      issueTypes(first: 100) {
        nodes {
          id
          name
          isEnabled
          pinnedFields {
            ...IssueFieldData
          }
        }
      }
      issueFields(first: 100) {
        nodes {
          ...IssueFieldData
        }
      }
    }
    repository(owner: $owner, name: $repo) {
      nameWithOwner
      isPrivate
      viewerCanSeeIssueFields
      owner {
        __typename
        login
      }
      issueTypes(first: 100) {
        nodes {
          id
          name
          isEnabled
          pinnedFields {
            ...IssueFieldData
          }
        }
      }
      issueFields(first: 100) {
        nodes {
          ...IssueFieldData
        }
      }
      labels(first: 100, after: $labelCursor) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          color
          description
          isDefault
          issues {
            totalCount
          }
          pullRequests {
            totalCount
          }
        }
      }
    }
  }

  fragment IssueFieldData on IssueFields {
    __typename
    ... on Node {
      id
    }
    ... on IssueFieldCommon {
      name
      dataType
      description
      visibility
    }
    ... on IssueFieldSingleSelect {
      options {
        id
        name
        color
        description
      }
    }
  }
`;

function defaultRunner(command, args) {
  return spawnSync(command, args, { encoding: 'utf8' });
}

function resultStatus(result) {
  return result.returncode ?? result.status ?? 1;
}

function resultError(result, fallback) {
  return String(result.stderr ?? result.error?.message ?? result.stdout ?? '').trim() || fallback;
}

function normalizeDataType(value) {
  return String(value ?? '')
    .toLowerCase()
    .replaceAll('-', '_');
}

function normalizeVisibility(value) {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'all') return 'all';
  if (['org_only', 'organization_only', 'organization_members_only'].includes(normalized)) {
    return 'organization_members_only';
  }
  return normalized || null;
}

function normalizeField(field) {
  return {
    id: field.id ?? null,
    name: field.name,
    dataType: normalizeDataType(field.dataType),
    description: field.description ?? '',
    visibility: normalizeVisibility(field.visibility),
    options: (field.options ?? []).map((option) => ({
      id: option.id ?? null,
      name: option.name,
      color: option.color ?? null,
      description: option.description ?? '',
    })),
  };
}

function normalizeIssueType(issueType) {
  return {
    id: issueType.id ?? null,
    name: issueType.name,
    enabled: issueType.isEnabled !== false,
    pinnedFields: (issueType.pinnedFields ?? []).map(normalizeField),
  };
}

function normalizeLabel(label) {
  return {
    id: label.id ?? null,
    name: label.name,
    color: String(label.color ?? '').replace(/^#/, ''),
    description: label.description ?? '',
    default: Boolean(label.isDefault),
    issueCount: label.issues?.totalCount ?? 0,
    pullRequestCount: label.pullRequests?.totalCount ?? 0,
  };
}

function available(values) {
  return { status: 'ok', values };
}

function unavailable(reason) {
  return { status: 'unavailable', values: [], reason };
}

function parsePayload(result) {
  try {
    return JSON.parse(String(result.stdout ?? '{}'));
  } catch {
    return null;
  }
}

function hasErrorPath(payload, rootName, surfaceName) {
  return (payload?.errors ?? []).some(({ path = [] }) => {
    const pathText = path.map(String).join('.');
    return pathText.includes(rootName) && pathText.includes(surfaceName);
  });
}

function partialReason(payload, rootName, surfaceName, fallback) {
  const match = (payload?.errors ?? []).find(({ path = [] }) => {
    const pathText = path.map(String).join('.');
    return pathText.includes(rootName) && pathText.includes(surfaceName);
  });
  return match?.message ?? fallback;
}

/** Read-only GitHub issue schema inspection with an injectable process boundary. */
export class GitHubSchemaClient {
  #runner;

  constructor({ runner = defaultRunner } = {}) {
    this.#runner = runner;
  }

  #run(args) {
    return this.#runner('gh', args);
  }

  ensureAvailable() {
    const version = this.#run(['--version']);
    if (version.error?.code === 'ENOENT') {
      throw new Error('GitHub CLI (gh) is required for schema inspection.');
    }
    if (resultStatus(version) !== 0) {
      throw new Error(resultError(version, 'GitHub CLI availability check failed.'));
    }

    const auth = this.#run(['auth', 'status']);
    return resultStatus(auth) === 0
      ? []
      : [
          'GitHub CLI authentication could not be verified; public reads may still succeed, but private or organization schema reads can fail.',
        ];
  }

  #query(target, labelCursor = null) {
    const args = [
      'api',
      'graphql',
      '-f',
      `query=${SCHEMA_INSPECTION_QUERY}`,
      '-F',
      `owner=${target.owner}`,
      '-F',
      `repo=${target.repo}`,
    ];
    if (labelCursor) args.push('-F', `labelCursor=${labelCursor}`);
    return this.#run(args);
  }

  inspect(target) {
    const firstResult = this.#query(target);
    const firstPayload = parsePayload(firstResult);
    const firstRepository = firstPayload?.data?.repository;
    if (!firstRepository) {
      throw new Error(
        resultError(firstResult, `Unable to inspect GitHub repository ${target.slug}.`),
      );
    }

    const warnings = (firstPayload.errors ?? []).map(({ message }) => message);
    const ownerType = firstRepository.owner?.__typename ?? 'Unknown';
    const organizationOwned = ownerType === 'Organization';
    const organization = firstPayload.data.organization;

    let labels = [...(firstRepository.labels?.nodes ?? [])];
    let pageInfo = firstRepository.labels?.pageInfo;
    while (pageInfo?.hasNextPage && pageInfo.endCursor) {
      const pageResult = this.#query(target, pageInfo.endCursor);
      const pagePayload = parsePayload(pageResult);
      const pageRepository = pagePayload?.data?.repository;
      const pageLabels = pageRepository?.labels;
      if (!pageLabels) {
        warnings.push(
          resultError(pageResult, `Could not inspect all repository labels for ${target.slug}.`),
        );
        break;
      }
      warnings.push(...(pagePayload.errors ?? []).map(({ message }) => message));
      labels = labels.concat(pageLabels.nodes ?? []);
      pageInfo = pageLabels.pageInfo;
    }

    const repositoryTypesUnavailable = hasErrorPath(firstPayload, 'repository', 'issueTypes');
    const repositoryFieldsUnavailable = hasErrorPath(firstPayload, 'repository', 'issueFields');
    const organizationTypesUnavailable = hasErrorPath(firstPayload, 'organization', 'issueTypes');
    const organizationFieldsUnavailable = hasErrorPath(firstPayload, 'organization', 'issueFields');

    return {
      repository: {
        slug: firstRepository.nameWithOwner ?? target.slug,
        ownerLogin: firstRepository.owner?.login ?? target.owner,
        ownerType,
        private: Boolean(firstRepository.isPrivate),
        viewerCanSeeIssueFields: Boolean(firstRepository.viewerCanSeeIssueFields),
      },
      organizationIssueTypes: organizationOwned
        ? organizationTypesUnavailable || !organization?.issueTypes
          ? unavailable(
              partialReason(
                firstPayload,
                'organization',
                'issueTypes',
                'Organization issue types could not be inspected.',
              ),
            )
          : available(organization.issueTypes.nodes.map(normalizeIssueType))
        : { status: 'not_applicable', values: [] },
      repositoryIssueTypes: organizationOwned
        ? repositoryTypesUnavailable || !firstRepository.issueTypes
          ? unavailable(
              partialReason(
                firstPayload,
                'repository',
                'issueTypes',
                'Repository issue types could not be inspected.',
              ),
            )
          : available(firstRepository.issueTypes.nodes.map(normalizeIssueType))
        : { status: 'not_applicable', values: [] },
      issueFields: organizationOwned
        ? organizationFieldsUnavailable || repositoryFieldsUnavailable
          ? unavailable(
              partialReason(
                firstPayload,
                repositoryFieldsUnavailable ? 'repository' : 'organization',
                'issueFields',
                'Issue fields could not be inspected.',
              ),
            )
          : available((organization?.issueFields?.nodes ?? []).map(normalizeField))
        : { status: 'not_applicable', values: [] },
      repositoryLabels: firstRepository.labels
        ? available(labels.map(normalizeLabel))
        : unavailable('Repository labels could not be inspected.'),
      organizationDefaultLabels: organizationOwned
        ? {
            status: 'manual',
            reason:
              'GitHub has no public API for listing organization default labels; inspect this organization setting manually.',
          }
        : {
            status: 'not_applicable',
            reason: 'Personal repositories have no organization defaults.',
          },
      warnings,
    };
  }
}
