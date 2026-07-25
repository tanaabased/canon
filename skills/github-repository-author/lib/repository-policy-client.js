import canonicalPolicy from '../references/canonical-repository-settings.json' with {
  type: 'json',
};
import diffManagedValues from '../utils/diff-managed-values.js';
import normalizeBranchProtection from '../utils/normalize-branch-protection.js';
import normalizeRepositorySlug from '../utils/normalize-repository-slug.js';
import runGh from '../utils/run-gh.js';

const MAIN_BRANCH = 'main';
const DEFAULT_MAIN_WAIT_ATTEMPTS = 5;
const NOT_FOUND_STATUS = 404;

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

/** Error carrying a recoverable repository-policy report. */
export class RepositoryPolicyError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'RepositoryPolicyError';
    this.report = options.report ?? null;
    this.step = options.step ?? null;
  }
}

function parseHttpStatus(result) {
  const text = `${result.stderr ?? ''}\n${result.stdout ?? ''}`;
  const match = text.match(/HTTP\s+(\d{3})/i);
  return match ? Number(match[1]) : null;
}

function commandFailureMessage(result, fallback) {
  return String(result.stderr || result.stdout || result.error?.message || fallback).trim();
}

function responseJson(result, fallback) {
  const content = String(result.stdout ?? '').trim();
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new RepositoryPolicyError(`${fallback}: ${error.message}`);
  }
}

function makeDesiredState(policy = canonicalPolicy) {
  const collaborators = Object.fromEntries(
    policy.collaborators.map((entry) => [
      entry.username,
      {
        direct_role: entry.expected_role,
        effective_role: entry.expected_role,
        pending_invitation: false,
      },
    ]),
  );
  const branch = policy.branches[MAIN_BRANCH];

  return {
    branches: {
      [MAIN_BRANCH]: {
        exists: true,
        protection: normalizeBranchProtection(branch.protection),
        required_signatures: Boolean(branch.required_signatures),
      },
    },
    collaborators,
    repository: cloneJson(policy.repository),
  };
}

function normalizeRepositorySettings(repository, policy = canonicalPolicy) {
  return Object.fromEntries(
    Object.keys(policy.repository).map((key) => [key, repository?.[key] ?? null]),
  );
}

function normalizeCollaborator(permission, directCollaborator, pendingInvitation) {
  return {
    direct_role: directCollaborator?.role_name ?? directCollaborator?.permission ?? 'none',
    effective_role: permission?.role_name ?? permission?.permission ?? 'none',
    pending_invitation: Boolean(pendingInvitation),
  };
}

function makeMissingReport(slug, policy = canonicalPolicy) {
  const desired = {
    creation: cloneJson(policy.creation),
    ...makeDesiredState(policy),
  };

  return {
    branch_action: null,
    changes: diffManagedValues(null, desired),
    current: null,
    desired,
    status: 'missing',
    target: slug,
  };
}

function branchAction({ branches, defaultBranch, mainExists }) {
  if (mainExists) {
    return null;
  }

  if (branches.length === 0) {
    return {
      type: 'initialize',
    };
  }

  if (defaultBranch && defaultBranch !== MAIN_BRANCH) {
    return {
      from: defaultBranch,
      to: MAIN_BRANCH,
      type: 'rename-default',
    };
  }

  return {
    type: 'missing-main',
  };
}

function defaultSleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

/**
 * GitHub repository-policy boundary with an injectable `gh` command runner.
 * Public mutation methods are non-interactive; callers own user authorization.
 */
export class RepositoryPolicyClient {
  constructor(options = {}) {
    this.policy = options.policy ?? canonicalPolicy;
    this.runner = options.runner ?? runGh;
    this.sleep = options.sleep ?? defaultSleep;
    this.waitAttempts = options.waitAttempts ?? DEFAULT_MAIN_WAIT_ATTEMPTS;
  }

  ensureReady() {
    const version = this.runner(['--version']);
    if (version.error || version.status !== 0) {
      throw new RepositoryPolicyError(
        commandFailureMessage(version, 'gh is not installed or available on PATH.'),
      );
    }

    const auth = this.runner(['auth', 'status']);
    if (auth.error || auth.status !== 0) {
      throw new RepositoryPolicyError(commandFailureMessage(auth, 'gh is not authenticated.'));
    }
  }

  request(method, endpoint, body, options = {}) {
    const args = ['api', endpoint];
    if (method !== 'GET') {
      args.push('--method', method);
    }

    const commandOptions = {};
    if (body !== undefined) {
      args.push('--input', '-');
      commandOptions.input = `${JSON.stringify(body)}\n`;
    }

    const result = this.runner(args, commandOptions);
    if (!result.error && result.status === 0) {
      return {
        data: responseJson(result, `Invalid JSON from ${endpoint}`),
        missing: false,
      };
    }

    const httpStatus = parseHttpStatus(result);
    if (options.allowNotFound && httpStatus === NOT_FOUND_STATUS) {
      return { data: null, missing: true };
    }

    throw new RepositoryPolicyError(
      commandFailureMessage(result, `${method} ${endpoint} failed.`),
      {
        step: options.step ?? endpoint,
      },
    );
  }

  inspect(slugValue) {
    const slug = normalizeRepositorySlug(slugValue);
    this.ensureReady();

    const repositoryResponse = this.request('GET', `/repos/${slug}`, undefined, {
      allowNotFound: true,
      step: 'inspect-repository',
    });
    if (repositoryResponse.missing) {
      return makeMissingReport(slug, this.policy);
    }

    const repository = repositoryResponse.data;
    const mainResponse = this.request('GET', `/repos/${slug}/branches/${MAIN_BRANCH}`, undefined, {
      allowNotFound: true,
      step: 'inspect-main',
    });
    const branches = mainResponse.missing
      ? this.request('GET', `/repos/${slug}/branches?per_page=100`, undefined, {
          step: 'inspect-branches',
        }).data ?? []
      : [mainResponse.data];
    const invitations = this.request('GET', `/repos/${slug}/invitations`, undefined, {
      step: 'inspect-invitations',
    }).data ?? [];
    const directCollaborators = this.request(
      'GET',
      `/repos/${slug}/collaborators?affiliation=direct&per_page=100`,
      undefined,
      { step: 'inspect-direct-collaborators' },
    ).data ?? [];
    const mainExists = !mainResponse.missing;
    const collaborators = {};

    for (const collaborator of this.policy.collaborators) {
      const permissionResponse = this.request(
        'GET',
        `/repos/${slug}/collaborators/${collaborator.username}/permission`,
        undefined,
        {
          allowNotFound: true,
          step: `inspect-collaborator-${collaborator.username}`,
        },
      );
      const pendingInvitation = invitations.some(
        (invitation) =>
          invitation?.invitee?.login?.toLowerCase() === collaborator.username.toLowerCase(),
      );
      const directCollaborator = directCollaborators.find(
        (entry) => entry?.login?.toLowerCase() === collaborator.username.toLowerCase(),
      );
      collaborators[collaborator.username] = normalizeCollaborator(
        permissionResponse.data,
        directCollaborator,
        pendingInvitation,
      );
    }

    const protectionResponse = mainExists
      ? this.request('GET', `/repos/${slug}/branches/${MAIN_BRANCH}/protection`, undefined, {
          allowNotFound: true,
          step: 'inspect-main-protection',
        })
      : { data: null, missing: true };
    const current = {
      branches: {
        [MAIN_BRANCH]: {
          exists: mainExists,
          protection: normalizeBranchProtection(protectionResponse.data),
          required_signatures: Boolean(
            protectionResponse.data?.required_signatures?.enabled ??
              protectionResponse.data?.required_signatures,
          ),
        },
      },
      collaborators,
      repository: normalizeRepositorySettings(repository, this.policy),
    };
    const desired = makeDesiredState(this.policy);
    const changes = diffManagedValues(current, desired);
    const action = branchAction({
      branches,
      defaultBranch: repository.default_branch,
      mainExists,
    });

    return {
      branch_action: action,
      changes,
      current,
      desired,
      status: changes.length === 0 && !action ? 'aligned' : 'drifted',
      target: slug,
    };
  }

  waitForMain(slug) {
    for (let attempt = 0; attempt < this.waitAttempts; attempt += 1) {
      const response = this.request('GET', `/repos/${slug}/branches/${MAIN_BRANCH}`, undefined, {
        allowNotFound: true,
        step: 'wait-for-main',
      });
      if (!response.missing) {
        return response.data;
      }

      if (attempt < this.waitAttempts - 1) {
        this.sleep(250 * (attempt + 1));
      }
    }

    throw new RepositoryPolicyError(
      `Repository ${slug} did not expose main after initialization.`,
      {
        step: 'wait-for-main',
      },
    );
  }

  waitForRepository(slug) {
    for (let attempt = 0; attempt < this.waitAttempts; attempt += 1) {
      const report = this.inspect(slug);
      if (report.status !== 'missing') {
        return report;
      }

      if (attempt < this.waitAttempts - 1) {
        this.sleep(250 * (attempt + 1));
      }
    }

    throw new RepositoryPolicyError(`Repository ${slug} was created but did not become readable.`, {
      step: 'wait-for-repository',
    });
  }

  renameDefaultBranch(slug, from, applied) {
    this.request(
      'POST',
      `/repos/${slug}/branches/${encodeURIComponent(from)}/rename`,
      { new_name: MAIN_BRANCH },
      { step: 'rename-default' },
    );
    applied.push(`rename-default:${from}->${MAIN_BRANCH}`);
    this.waitForMain(slug);
  }

  establishMain(slug, report, options, applied) {
    const action = report.branch_action;
    if (!action) {
      return;
    }

    if (action.type === 'initialize') {
      if (!options.initialize) {
        throw new RepositoryPolicyError(
          'Existing empty repository requires --initialize after approval.',
          {
            report,
            step: 'initialize-main',
          },
        );
      }

      const repoName = slug.split('/')[1];
      this.request(
        'PUT',
        `/repos/${slug}/contents/README.md`,
        {
          content: Buffer.from(`# ${repoName}\n`, 'utf8').toString('base64'),
          message: 'initialize repository',
        },
        { step: 'initialize-main' },
      );
      applied.push('initialize-main');
      const initialized = this.inspect(slug);
      if (initialized.branch_action?.type === 'rename-default') {
        this.renameDefaultBranch(slug, initialized.branch_action.from, applied);
      } else if (initialized.branch_action) {
        throw new RepositoryPolicyError(
          'README initialization did not establish a usable default branch.',
          {
            report: initialized,
            step: 'initialize-main',
          },
        );
      }
      return;
    }

    if (action.type === 'rename-default') {
      if (!options.renameDefault) {
        throw new RepositoryPolicyError(
          'Default branch rename requires --rename-default after separate approval.',
          {
            report,
            step: 'rename-default',
          },
        );
      }

      this.renameDefaultBranch(slug, action.from, applied);
      return;
    }

    throw new RepositoryPolicyError(
      'Repository has branches but main cannot be established automatically.',
      {
        report,
        step: 'establish-main',
      },
    );
  }

  apply(slugValue, options = {}) {
    const slug = normalizeRepositorySlug(slugValue);
    let report = this.inspect(slug);
    if (report.status === 'missing') {
      throw new RepositoryPolicyError('Repository is missing; use create instead of apply.', {
        report,
        step: 'apply',
      });
    }

    if (report.status === 'aligned') {
      return { ...report, applied: [], operation: 'apply' };
    }

    const applied = [];
    this.establishMain(slug, report, options, applied);
    if (report.branch_action) {
      report = this.inspect(slug);
    }

    if (report.changes.some((change) => change.path.startsWith('repository.'))) {
      this.request('PATCH', `/repos/${slug}`, this.policy.repository, {
        step: 'update-repository-settings',
      });
      applied.push('update-repository-settings');
    }

    for (const collaborator of this.policy.collaborators) {
      const pathPrefix = `collaborators.${collaborator.username}.`;
      if (!report.changes.some((change) => change.path.startsWith(pathPrefix))) {
        continue;
      }

      this.request(
        'PUT',
        `/repos/${slug}/collaborators/${collaborator.username}`,
        { permission: collaborator.permission },
        { step: `grant-${collaborator.username}` },
      );
      applied.push(`grant-${collaborator.username}-${collaborator.expected_role}`);

      const collaboratorReport = this.inspect(slug);
      const collaboratorDrift = collaboratorReport.changes.some((change) =>
        change.path.startsWith(pathPrefix),
      );
      if (collaboratorDrift) {
        throw new RepositoryPolicyError(
          `${collaborator.username} does not yet have effective ` +
            `${collaborator.expected_role} access; an invitation may be pending.`,
          {
            report: { ...collaboratorReport, applied },
            step: `verify-${collaborator.username}`,
          },
        );
      }

      report = collaboratorReport;
    }

    const protectionPath = `branches.${MAIN_BRANCH}.protection`;
    if (report.changes.some((change) => change.path.startsWith(protectionPath))) {
      this.request(
        'PUT',
        `/repos/${slug}/branches/${MAIN_BRANCH}/protection`,
        this.policy.branches[MAIN_BRANCH].protection,
        {
          step: 'update-main-protection',
        },
      );
      applied.push('update-main-protection');
    }

    const signaturePath = `branches.${MAIN_BRANCH}.required_signatures`;
    if (report.changes.some((change) => change.path === signaturePath)) {
      const method = this.policy.branches[MAIN_BRANCH].required_signatures ? 'POST' : 'DELETE';
      this.request(
        method,
        `/repos/${slug}/branches/${MAIN_BRANCH}/protection/required_signatures`,
        undefined,
        {
          step: 'update-main-signatures',
        },
      );
      applied.push('update-main-signatures');
    }

    const verified = this.inspect(slug);
    if (verified.status !== 'aligned') {
      throw new RepositoryPolicyError('Repository policy apply completed with remaining drift.', {
        report: { ...verified, applied },
        step: 'verify-policy',
      });
    }

    return {
      ...verified,
      applied,
      operation: 'apply',
    };
  }

  create(slugValue) {
    const slug = normalizeRepositorySlug(slugValue);
    const report = this.inspect(slug);
    if (report.status !== 'missing') {
      throw new RepositoryPolicyError(
        'Repository already exists; use inspect or apply instead of create.',
        {
          report,
          step: 'create',
        },
      );
    }

    const visibility = this.policy.creation.visibility;
    const args = ['repo', 'create', slug, `--${visibility}`];
    if (this.policy.creation.initialize_with_readme) {
      args.push('--add-readme');
    }

    const result = this.runner(args);
    if (result.error || result.status !== 0) {
      throw new RepositoryPolicyError(commandFailureMessage(result, `Unable to create ${slug}.`), {
        report,
        step: 'create-repository',
      });
    }

    try {
      this.waitForRepository(slug);
      const applied = this.apply(slug, {
        initialize: true,
        renameDefault: true,
      });
      return {
        ...applied,
        applied: ['create-repository', ...applied.applied],
        operation: 'create',
      };
    } catch (error) {
      if (error instanceof RepositoryPolicyError) {
        throw new RepositoryPolicyError(
          `Repository ${slug} was created, but policy synchronization is incomplete: ${error.message}`,
          {
            report: error.report,
            step: error.step,
          },
        );
      }

      throw error;
    }
  }
}

export { canonicalPolicy };
