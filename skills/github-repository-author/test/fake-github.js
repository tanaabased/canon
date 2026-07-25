import canonicalPolicy from '../references/canonical-repository-settings.json' with { type: 'json' };

export const TARGET = 'acme/widget';

function success(data = null) {
  return {
    error: null,
    status: 0,
    stderr: '',
    stdout: data === null ? '' : JSON.stringify(data),
  };
}

function failure(status, message) {
  return {
    error: null,
    status: 1,
    stderr: `gh: ${message} (HTTP ${status})`,
    stdout: '',
  };
}

export function protectionResponse(
  payload = canonicalPolicy.branches.main.protection,
  signatures = false,
) {
  const reviews = payload.required_pull_request_reviews;
  const responseActors = (values, key) => values.map((value) => ({ [key]: value }));

  return {
    allow_deletions: { enabled: payload.allow_deletions },
    allow_force_pushes: { enabled: payload.allow_force_pushes },
    allow_fork_syncing: { enabled: payload.allow_fork_syncing },
    block_creations: { enabled: payload.block_creations },
    enforce_admins: { enabled: payload.enforce_admins },
    lock_branch: { enabled: payload.lock_branch },
    required_conversation_resolution: { enabled: payload.required_conversation_resolution },
    required_linear_history: { enabled: payload.required_linear_history },
    required_pull_request_reviews: {
      bypass_pull_request_allowances: {
        apps: responseActors(reviews.bypass_pull_request_allowances.apps, 'slug'),
        teams: responseActors(reviews.bypass_pull_request_allowances.teams, 'slug'),
        users: responseActors(reviews.bypass_pull_request_allowances.users, 'login'),
      },
      dismissal_restrictions: {
        apps: responseActors(reviews.dismissal_restrictions.apps, 'slug'),
        teams: responseActors(reviews.dismissal_restrictions.teams, 'slug'),
        users: responseActors(reviews.dismissal_restrictions.users, 'login'),
      },
      dismiss_stale_reviews: reviews.dismiss_stale_reviews,
      require_code_owner_reviews: reviews.require_code_owner_reviews,
      require_last_push_approval: reviews.require_last_push_approval,
      required_approving_review_count: reviews.required_approving_review_count,
    },
    required_signatures: { enabled: signatures },
    required_status_checks: {
      checks: payload.required_status_checks.checks,
      strict: payload.required_status_checks.strict,
    },
    restrictions: payload.restrictions,
  };
}

export function canonicalRepository(overrides = {}) {
  return {
    ...canonicalPolicy.repository,
    archived: true,
    description: 'Unmanaged description',
    private: true,
    visibility: 'private',
    ...overrides,
  };
}

export function createRemote(overrides = {}) {
  const remote = {
    acceptInvitations: true,
    branches: [{ name: 'main' }],
    commands: [],
    creationDefaultBranch: 'main',
    directCollaborators: [{ login: 'tanaabot', permission: 'write', role_name: 'write' }],
    emptyInitializationBranch: 'main',
    exists: true,
    failAuth: false,
    failProtection: false,
    invitations: [],
    mainExists: true,
    permission: { permission: 'write', role_name: 'write' },
    protection: protectionResponse(),
    repository: canonicalRepository(),
    ...overrides,
  };

  remote.runner = (args, options = {}) => {
    const body = options.input ? JSON.parse(options.input) : null;
    remote.commands.push({ args: [...args], body });

    if (args[0] === '--version') {
      return success({ version: 'test' });
    }
    if (args[0] === 'auth') {
      return remote.failAuth ? failure(401, 'authentication failed') : success();
    }
    if (args[0] === 'repo' && args[1] === 'create') {
      const defaultBranch = remote.creationDefaultBranch;
      remote.exists = true;
      remote.mainExists = defaultBranch === 'main';
      remote.branches = [{ name: defaultBranch }];
      remote.repository = canonicalRepository({ default_branch: defaultBranch, has_wiki: true });
      remote.permission = null;
      remote.directCollaborators = [];
      remote.protection = null;
      return success({ nameWithOwner: TARGET });
    }

    const endpoint = args[1];
    const methodIndex = args.indexOf('--method');
    const method = methodIndex === -1 ? 'GET' : args[methodIndex + 1];

    if (endpoint === `/repos/${TARGET}`) {
      if (!remote.exists) {
        return failure(404, 'Not Found');
      }
      if (method === 'PATCH') {
        Object.assign(remote.repository, body);
        return success(remote.repository);
      }
      return success(remote.repository);
    }
    if (!remote.exists) {
      return failure(404, 'Not Found');
    }
    if (endpoint === `/repos/${TARGET}/branches/main`) {
      return remote.mainExists ? success({ name: 'main' }) : failure(404, 'Not Found');
    }
    if (endpoint === `/repos/${TARGET}/branches?per_page=100`) {
      return success(remote.branches);
    }
    if (endpoint === `/repos/${TARGET}/invitations`) {
      return success(remote.invitations);
    }
    if (endpoint === `/repos/${TARGET}/collaborators?affiliation=direct&per_page=100`) {
      return success(remote.directCollaborators);
    }
    if (endpoint === `/repos/${TARGET}/collaborators/tanaabot/permission`) {
      return remote.permission ? success(remote.permission) : failure(404, 'Not Found');
    }
    if (endpoint === `/repos/${TARGET}/collaborators/tanaabot` && method === 'PUT') {
      if (remote.acceptInvitations) {
        remote.permission = { permission: 'write', role_name: 'write' };
        remote.directCollaborators = [
          { login: 'tanaabot', permission: 'write', role_name: 'write' },
        ];
        remote.invitations = [];
      } else {
        remote.permission = null;
        remote.invitations = [{ invitee: { login: 'tanaabot' } }];
      }
      return success({ permission: body.permission });
    }
    if (endpoint === `/repos/${TARGET}/branches/main/protection`) {
      if (method === 'GET') {
        return remote.protection ? success(remote.protection) : failure(404, 'Not Found');
      }
      if (remote.failProtection) {
        return failure(403, 'Forbidden');
      }
      remote.protection = protectionResponse(
        body,
        remote.protection?.required_signatures?.enabled ?? false,
      );
      return success(remote.protection);
    }
    if (
      endpoint === `/repos/${TARGET}/branches/main/protection/required_signatures` &&
      method === 'DELETE'
    ) {
      remote.protection.required_signatures = { enabled: false };
      return success();
    }
    if (endpoint === `/repos/${TARGET}/contents/README.md` && method === 'PUT') {
      const defaultBranch = remote.emptyInitializationBranch;
      remote.mainExists = defaultBranch === 'main';
      remote.branches = [{ name: defaultBranch }];
      remote.repository.default_branch = defaultBranch;
      return success({ content: { path: 'README.md' } });
    }
    if (endpoint === `/repos/${TARGET}/branches/master/rename` && method === 'POST') {
      remote.mainExists = true;
      remote.branches = [{ name: 'main' }];
      remote.repository.default_branch = 'main';
      return success({ name: 'main' });
    }

    throw new Error(`Unexpected fake gh command: ${args.join(' ')}`);
  };

  return remote;
}

export function mutatingCommands(remote) {
  return remote.commands.filter(({ args }) => args[0] === 'repo' || args.includes('--method'));
}

export { canonicalPolicy };
