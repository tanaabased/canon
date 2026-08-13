import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

import { MANAGED_ISSUE_FORM_PATHS } from '../lib/github-issue-form-client.js';
import { serializeYaml } from './serialize-yaml.js';

const FORM_TOP_LEVEL_KEYS = Object.freeze(
  new Set(['name', 'description', 'title', 'labels', 'assignees', 'type', 'projects', 'body']),
);
const PRESERVED_FORM_KEYS = Object.freeze(['title', 'assignees', 'projects']);
const CONFIG_KEYS = Object.freeze(new Set(['blank_issues_enabled', 'contact_links']));

function contentDigest(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

function parseYaml(content, path) {
  try {
    let document;
    if (globalThis.Bun?.YAML?.parse) {
      document = globalThis.Bun.YAML.parse(content);
    } else {
      const result = spawnSync(
        'bun',
        [
          '-e',
          'const text = await Bun.stdin.text(); process.stdout.write(JSON.stringify(Bun.YAML.parse(text)));',
        ],
        { encoding: 'utf8', input: content },
      );
      if (result.status !== 0) throw new Error(String(result.stderr).trim());
      document = JSON.parse(result.stdout);
    }
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      throw new Error('document must be a mapping');
    }
    return document;
  } catch (error) {
    throw new Error(`${path} contains invalid YAML: ${error.message}`, { cause: error });
  }
}

function mergeForm(desired, current, path) {
  const blockers = [];
  const preserved = [];
  const unknownKeys = Object.keys(current).filter((key) => !FORM_TOP_LEVEL_KEYS.has(key));
  if (unknownKeys.length > 0) {
    blockers.push(`${path} has unsupported top-level keys: ${unknownKeys.join(', ')}.`);
  }
  if (
    current.labels !== undefined &&
    (Array.isArray(current.labels) ? current.labels.length : String(current.labels).trim())
  ) {
    blockers.push(
      `${path} auto-applies labels, which conflicts with canonical post-normalization label handling.`,
    );
  }
  if (!Array.isArray(current.body)) blockers.push(`${path} body must be an array.`);
  if (blockers.length > 0) return { blockers, document: desired, preserved };

  const managedIds = new Set(desired.body.map(({ id }) => id).filter(Boolean));
  const desiredMarkdown = new Set(
    desired.body
      .filter(({ type }) => type === 'markdown')
      .map(({ attributes }) => String(attributes?.value ?? '')),
  );
  const seenIds = new Set();
  const extraMarkdown = [];
  for (const element of current.body) {
    if (!element || typeof element !== 'object' || Array.isArray(element)) {
      blockers.push(`${path} contains a non-mapping body element.`);
      continue;
    }
    if (element.type === 'markdown') {
      const value = String(element.attributes?.value ?? '');
      if (!desiredMarkdown.has(value)) {
        extraMarkdown.push(element);
        preserved.push('additional markdown guidance');
      }
      continue;
    }
    const id = String(element.id ?? '');
    if (!id) {
      blockers.push(`${path} contains a submitted input without an id.`);
      continue;
    }
    if (seenIds.has(id)) {
      blockers.push(`${path} contains duplicate input id ${id}.`);
      continue;
    }
    seenIds.add(id);
    if (!managedIds.has(id)) {
      blockers.push(
        `${path} contains unmanaged submitted input ${id}; automatic alignment would lose its normalization semantics.`,
      );
    }
  }

  const document = { name: desired.name, description: desired.description };
  for (const key of PRESERVED_FORM_KEYS) {
    if (current[key] !== undefined) {
      document[key] = current[key];
      preserved.push(key);
    }
  }
  if (desired.type !== undefined) document.type = desired.type;
  document.body = [...extraMarkdown, ...desired.body];
  return { blockers, document, preserved: [...new Set(preserved)] };
}

function mergeConfig(desired, current, path) {
  const blockers = [];
  const unknownKeys = Object.keys(current).filter((key) => !CONFIG_KEYS.has(key));
  if (unknownKeys.length > 0) {
    blockers.push(`${path} has unsupported configuration keys: ${unknownKeys.join(', ')}.`);
  }
  if (current.contact_links !== undefined && !Array.isArray(current.contact_links)) {
    blockers.push(`${path} contact_links must be an array.`);
  }
  return {
    blockers,
    document: {
      blank_issues_enabled: desired.blank_issues_enabled,
      ...(Array.isArray(current.contact_links) ? { contact_links: current.contact_links } : {}),
    },
    preserved: Array.isArray(current.contact_links) ? ['contact_links'] : [],
  };
}

function mergeFile(desiredFile, existingFile) {
  if (existingFile.status === 'missing') {
    return { blockers: [], document: desiredFile.document, preserved: [] };
  }
  if (existingFile.status !== 'present') {
    return {
      blockers: [existingFile.error ?? `${desiredFile.path} could not be inspected.`],
      document: desiredFile.document,
      preserved: [],
    };
  }
  try {
    const current = parseYaml(existingFile.content, desiredFile.path);
    return desiredFile.kind === null
      ? mergeConfig(desiredFile.document, current, desiredFile.path)
      : mergeForm(desiredFile.document, current, desiredFile.path);
  } catch (error) {
    return { blockers: [error.message], document: desiredFile.document, preserved: [] };
  }
}

/** Build an exact create/update-only repository plan while retaining compatible additions. */
export function buildIssueFormRepositoryPlan(inspection, desiredSet) {
  const blockers = [];
  if (!['Organization', 'User'].includes(inspection.ownerType)) {
    blockers.push(
      `Repository owner type ${inspection.ownerType} cannot be mapped to an issue-form variant.`,
    );
  }
  const existingByPath = new Map(inspection.files.map((file) => [file.path, file]));
  const operations = [];
  const preserved = [];
  for (const desiredFile of desiredSet.files) {
    const existingFile = existingByPath.get(desiredFile.path) ?? {
      path: desiredFile.path,
      status: 'unavailable',
      sha: null,
      content: null,
      error: `${desiredFile.path} was absent from the inspection result.`,
    };
    const merged = mergeFile(desiredFile, existingFile);
    blockers.push(...merged.blockers);
    for (const item of merged.preserved) preserved.push({ path: desiredFile.path, item });
    const afterContent = serializeYaml(merged.document);
    if (existingFile.status === 'present' && existingFile.content === afterContent) continue;
    if (!['missing', 'present'].includes(existingFile.status)) continue;
    operations.push({
      kind: existingFile.status === 'missing' ? 'create_file' : 'update_file',
      method: 'PUT',
      endpoint: `/repos/${inspection.target.slug}/contents/${desiredFile.path}`,
      path: desiredFile.path,
      message: 'align canonical issue forms',
      before: {
        sha: existingFile.sha,
        contentDigest: existingFile.content === null ? null : contentDigest(existingFile.content),
      },
      after: { content: afterContent, contentDigest: contentDigest(afterContent) },
    });
  }
  return {
    blockers,
    plan: {
      target: inspection.target.slug,
      branch: inspection.defaultBranch,
      repositoryMode: desiredSet.repositoryMode,
      operations,
      preserved,
      unmanagedFiles: inspection.unmanagedFiles,
      deletions: [],
    },
  };
}

export function issueFormRepositoryPlanDigest(plan) {
  return `sha256:${createHash('sha256').update(JSON.stringify(plan)).digest('hex')}`;
}

/** Require exact repository, branch, and digest authorization for only the four owned paths. */
export function evaluateIssueFormRepositoryAuthorization(plan, digest, authorization = {}) {
  const reasons = [];
  const allowedPaths = new Set(MANAGED_ISSUE_FORM_PATHS);
  const unsafe =
    plan.deletions.length > 0 ||
    plan.operations.some(
      ({ kind, method, endpoint, path }) =>
        !['create_file', 'update_file'].includes(kind) ||
        method !== 'PUT' ||
        !allowedPaths.has(path) ||
        endpoint !== `/repos/${plan.target}/contents/${path}`,
    );
  if (unsafe)
    reasons.push('The issue-form plan contains an operation outside the four managed paths.');
  if (authorization.approvedRepository !== plan.target) {
    reasons.push(`Issue-form authorization must name repository ${plan.target} exactly.`);
  }
  if (authorization.approvedBranch !== plan.branch) {
    reasons.push(`Issue-form authorization must name branch ${plan.branch} exactly.`);
  }
  if (authorization.approvedDigest !== digest) {
    reasons.push('Issue-form authorization does not match the exact repository plan digest.');
  }
  return {
    approved: reasons.length === 0,
    repository: plan.target,
    branch: plan.branch,
    digest,
    reasons,
  };
}
