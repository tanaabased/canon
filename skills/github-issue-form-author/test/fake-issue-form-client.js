import { MANAGED_ISSUE_FORM_PATHS } from '../lib/github-issue-form-client.js';

function entry(value, index) {
  if (typeof value === 'string') return { content: value, sha: `sha-${index + 1}` };
  return { content: value.content, sha: value.sha ?? `sha-${index + 1}` };
}

/** Mutable fake for exact repository inspection, SHA-bound writes, and partial failure tests. */
export function fakeIssueFormClient({
  ownerType = 'Organization',
  defaultBranch = 'main',
  files = {},
  unmanagedFiles = [],
  failAt = null,
} = {}) {
  const state = {
    ownerType,
    defaultBranch,
    files: new Map(
      Object.entries(files).map(([path, value], index) => [path, entry(value, index)]),
    ),
    unmanagedFiles: structuredClone(unmanagedFiles),
    writeCount: 0,
  };
  const calls = [];

  return {
    calls,
    state,
    ensureAvailable() {
      calls.push({ operation: 'ensureAvailable' });
      return [];
    },
    inspectRepository(target) {
      const slug = target.slug ?? target;
      calls.push({ operation: 'inspectRepository', slug });
      return {
        target: {
          owner: slug.split('/')[0],
          repo: slug.split('/')[1],
          slug,
        },
        ownerType: state.ownerType,
        defaultBranch: state.defaultBranch,
        files: MANAGED_ISSUE_FORM_PATHS.map((path) => {
          const current = state.files.get(path);
          return current
            ? { path, status: 'present', sha: current.sha, content: current.content }
            : { path, status: 'missing', sha: null, content: null };
        }),
        unmanagedFiles: structuredClone(state.unmanagedFiles),
        warnings: [],
      };
    },
    putFile(target, branch, operation) {
      const slug = target.slug ?? target;
      state.writeCount += 1;
      calls.push({ operation: 'putFile', slug, branch, path: operation.path });
      if (branch !== state.defaultBranch) {
        return { ok: false, error: `branch ${branch} does not exist` };
      }
      if (failAt === state.writeCount) return { ok: false, error: '409 Conflict' };
      const current = state.files.get(operation.path);
      if ((current?.sha ?? null) !== (operation.before.sha ?? null)) {
        return { ok: false, error: '409 blob SHA conflict' };
      }
      const sha = `written-sha-${state.writeCount}`;
      state.files.set(operation.path, { content: operation.after.content, sha });
      return {
        ok: true,
        value: { path: operation.path, sha, commitSha: `commit-${state.writeCount}` },
      };
    },
  };
}
