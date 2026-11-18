#!/usr/bin/env bun
// @bun

// lib/run-github-cli.js
import { spawnSync } from "child_process";
var INHERITED_PROCESS_OPTIONS = ["cwd", "env"];
var GITHUB_API_VERSION_HEADER = "X-GitHub-Api-Version: 2026-03-10";
function githubCliResultStatus(result) {
  return result.returncode ?? result.status ?? 1;
}
function githubCliResultDetail(result) {
  return String(result.stderr ?? result.error?.message ?? result.stdout ?? "").trim();
}
function flattenGitHubPages(value) {
  if (!Array.isArray(value))
    return value;
  return value.every(Array.isArray) ? value.flat() : value;
}
function runGitHubCli(args, options = {}, dependencies = {}) {
  for (const key of INHERITED_PROCESS_OPTIONS) {
    if (Object.hasOwn(options, key)) {
      throw new Error(`GitHub CLI must inherit the active process ${key}.`);
    }
  }
  const spawn = dependencies.spawnSync ?? spawnSync;
  return spawn("gh", args, { encoding: "utf8", ...options });
}

// lib/read-repository-issue-metadata.js
var REPOSITORY_FIELDS_QUERY = `
  query RepositoryIssueFields($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      viewerCanSeeIssueFields
      viewerPermission
      issueFields(first: 100, after: $cursor) {
        totalCount
        pageInfo { hasNextPage endCursor }
        nodes {
          ... on Node { id }
          ... on IssueFieldCommon { name dataType description visibility }
          ... on IssueFieldDate { fullDatabaseId }
          ... on IssueFieldNumber { fullDatabaseId }
          ... on IssueFieldText { fullDatabaseId }
          ... on IssueFieldSingleSelect {
            fullDatabaseId
            options { id fullDatabaseId name color description }
          }
          ... on IssueFieldMultiSelect {
            fullDatabaseId
            options { id fullDatabaseId name color description }
          }
        }
      }
    }
  }
`;
function readJson(runner, args, description) {
  const result = runner(args);
  try {
    const payload = JSON.parse(result.stdout);
    if (args[1] === "graphql" && Array.isArray(payload?.errors) && payload.errors.length > 0) {
      return { payload };
    }
    if (githubCliResultStatus(result) === 0)
      return { payload };
  } catch {
    if (githubCliResultStatus(result) === 0) {
      return { error: `${description} returned invalid JSON.` };
    }
  }
  return { error: githubCliResultDetail(result) || `${description} could not be read.` };
}
function unavailable(reason) {
  return { status: "unavailable", values: [], reason };
}
function readRepositoryIssueFields(runner, target) {
  const values = [];
  const cursors = new Set;
  let cursor = null;
  let complete = true;
  let totalCount;
  do {
    const args = [
      "api",
      "graphql",
      "-f",
      `query=${REPOSITORY_FIELDS_QUERY}`,
      "-f",
      `owner=${target.owner}`,
      "-f",
      `repo=${target.repo}`
    ];
    if (cursor)
      args.push("-f", `cursor=${cursor}`);
    const { payload, error } = readJson(runner, args, "Repository issue fields");
    if (error)
      return unavailable(error);
    const errors = Array.isArray(payload?.errors) ? payload.errors : [];
    const fieldErrors = errors.filter(({ path }) => path?.[0] !== "repository" || !["viewerPermission", "viewerCanSeeIssueFields"].includes(path[1]));
    if (fieldErrors.length > 0) {
      return unavailable(fieldErrors.map(({ message }) => message).join("; "));
    }
    const repository = payload?.data?.repository;
    const { nodes, pageInfo, totalCount: pageCount } = repository?.issueFields ?? {};
    totalCount ??= pageCount;
    if (!Number.isSafeInteger(pageCount) || pageCount !== totalCount || !Array.isArray(nodes) || nodes.some((node) => !node?.id || !node.name || !node.dataType) || typeof pageInfo?.hasNextPage !== "boolean") {
      return unavailable("GitHub did not return a complete issue field page.");
    }
    complete &&= errors.length === 0 && repository.viewerCanSeeIssueFields === true && repository.viewerPermission === "ADMIN";
    values.push(...nodes);
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
    if (pageInfo.hasNextPage && (!cursor || cursors.has(cursor))) {
      return unavailable("GitHub did not return a usable issue field page cursor.");
    }
    cursors.add(cursor);
  } while (cursor);
  if (values.length !== totalCount || new Set(values.map(({ id }) => id)).size !== totalCount) {
    return unavailable("GitHub did not return all issue fields visible to the viewer.");
  }
  return { status: "ok", values, complete };
}
function readRepositoryIssueTypes(runner, target) {
  const { payload, error } = readJson(runner, [
    "api",
    `/repos/${target.slug}/issue-types`,
    "-H",
    GITHUB_API_VERSION_HEADER,
    "--paginate",
    "--slurp"
  ], "Repository issue types");
  if (error)
    return unavailable(error);
  const values = flattenGitHubPages(payload);
  if (!Array.isArray(values) || values.some((type) => !type?.name || typeof type.is_enabled !== "boolean")) {
    return unavailable("GitHub did not return a complete repository issue type list.");
  }
  return { status: "ok", values };
}

// skills/task-author/lib/github-capability-client.js
function commandFailure(result, context) {
  const detail = String(result.stderr ?? result.error?.message ?? "unknown error").trim();
  return new Error(`${context}: ${detail}`);
}
function parseJson(result, context) {
  try {
    return JSON.parse(String(result.stdout));
  } catch (error) {
    throw new Error(`${context} returned invalid JSON: ${error.message}`, { cause: error });
  }
}
function flattenCollection(payload, keys = []) {
  const pages = Array.isArray(payload) ? payload : [payload];
  return pages.flatMap((page) => {
    if (Array.isArray(page))
      return page;
    for (const key of keys) {
      if (Array.isArray(page?.[key]))
        return page[key];
    }
    return [];
  });
}
function numericId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
function taskField(field) {
  return {
    id: numericId(field.fullDatabaseId),
    name: field.name,
    data_type: field.dataType.toLowerCase(),
    ...Array.isArray(field.options) ? {
      options: field.options.map((option) => ({
        id: numericId(option.fullDatabaseId),
        name: option.name
      }))
    } : {}
  };
}

class GitHubCapabilityClient {
  #runner;
  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
  }
  #run(args) {
    return this.#runner(args);
  }
  ensureAvailable() {
    const version = this.#run(["--version"]);
    if (version.error?.code === "ENOENT") {
      throw new Error("GitHub CLI (gh) is required for repository capability discovery.");
    }
    if (version.status !== 0)
      throw commandFailure(version, "GitHub CLI availability check failed");
    const auth = this.#run(["auth", "status"]);
    return auth.status === 0 ? [] : [
      "GitHub CLI authentication could not be verified; public reads may still succeed, but private repository discovery can fail."
    ];
  }
  resolveCurrentRepository() {
    const result = this.#run(["repo", "view", "--json", "nameWithOwner"]);
    if (result.status !== 0)
      return null;
    const payload = parseJson(result, "Current repository discovery");
    return payload.nameWithOwner ?? null;
  }
  getJson(endpoint, { paginate = false, keys = [] } = {}) {
    const args = ["api", endpoint, "-H", GITHUB_API_VERSION_HEADER];
    if (paginate)
      args.push("--paginate", "--slurp");
    const result = this.#run(args);
    if (result.status !== 0)
      return { ok: false, error: commandFailure(result, `GET ${endpoint}`) };
    try {
      const payload = parseJson(result, `GET ${endpoint}`);
      return { ok: true, value: paginate ? flattenCollection(payload, keys) : payload };
    } catch (error) {
      return { ok: false, error };
    }
  }
  inspectRepository(target) {
    const warnings = [];
    const repositoryRead = this.getJson(`/repos/${target.slug}`);
    if (!repositoryRead.ok)
      throw repositoryRead.error;
    const repository = repositoryRead.value;
    const issueTypes = readRepositoryIssueTypes(this.#runner, target);
    const fields = readRepositoryIssueFields(this.#runner, target);
    for (const [name, collection] of [
      ["issue types", issueTypes],
      ["issue fields", fields]
    ]) {
      if (collection.reason)
        warnings.push(`Could not inspect repository ${name}: ${collection.reason}`);
    }
    const labels = this.optionalCollection(`/repos/${target.slug}/labels?per_page=100`, ["labels"], "repository labels", warnings);
    return {
      repository: {
        slug: target.slug,
        ownerLogin: repository.owner?.login ?? target.owner,
        ownerType: repository.owner?.type ?? "Unknown",
        private: Boolean(repository.private)
      },
      issueTypes,
      issueFields: { ...fields, values: fields.values.map(taskField) },
      labels,
      warnings
    };
  }
  optionalCollection(endpoint, keys, description, warnings) {
    const result = this.getJson(endpoint, { paginate: true, keys });
    if (result.ok)
      return { status: "ok", values: result.value };
    warnings.push(`Could not inspect ${description}: ${result.error.message}`);
    return { status: "unavailable", values: [] };
  }
}

// skills/task-author/lib/github-task-client.js
function parseResult(result, context) {
  if (result.status !== 0) {
    const detail = String(result.stderr ?? "").trim() || String(result.error?.message ?? "").trim() || String(result.stdout ?? "").trim() || "unknown error";
    return { ok: false, error: `${context}: ${detail}` };
  }
  try {
    return { ok: true, value: flattenGitHubPages(JSON.parse(String(result.stdout || "null"))) };
  } catch (error) {
    return { ok: false, error: `${context} returned invalid JSON: ${error.message}` };
  }
}

class GitHubTaskClient {
  #capabilities;
  #runner;
  constructor({ runner = runGitHubCli } = {}) {
    this.#runner = runner;
    this.#capabilities = new GitHubCapabilityClient({ runner });
  }
  ensureAvailable() {
    return this.#capabilities.ensureAvailable();
  }
  resolveCurrentRepository() {
    return this.#capabilities.resolveCurrentRepository();
  }
  inspectRepository(target) {
    return this.#capabilities.inspectRepository(target);
  }
  #request(method, endpoint, payload = null, { paginate = false } = {}) {
    const args = ["api", endpoint, "--method", method, "-H", GITHUB_API_VERSION_HEADER];
    const options = {};
    if (paginate)
      args.push("--paginate", "--slurp");
    if (payload !== null) {
      args.push("--input", "-");
      options.input = JSON.stringify(payload);
    }
    return parseResult(this.#runner(args, options), `${method} ${endpoint}`);
  }
  createIssue(target, payload) {
    return this.#request("POST", `/repos/${target.slug}/issues`, payload);
  }
  updateIssue(target, issueNumber, payload) {
    return this.#request("PATCH", `/repos/${target.slug}/issues/${issueNumber}`, payload);
  }
  addComment(target, issueNumber, body) {
    return this.#request("POST", `/repos/${target.slug}/issues/${issueNumber}/comments`, { body });
  }
  readIssue(target, issueNumber) {
    return this.#request("GET", `/repos/${target.slug}/issues/${issueNumber}`);
  }
  readIssueFieldValues(target, issueNumber) {
    return this.#request("GET", `/repos/${target.slug}/issues/${issueNumber}/issue-field-values?per_page=100`, null, { paginate: true });
  }
  readComments(target, issueNumber) {
    return this.#request("GET", `/repos/${target.slug}/issues/${issueNumber}/comments?per_page=100`, null, { paginate: true });
  }
}

// skills/task-author/lib/task-state-reader.js
function readTaskState(client, target, { comments = true, fields = true, issueNumber = target.issueNumber } = {}) {
  const issue = client.readIssue(target, issueNumber);
  const fieldRead = fields ? client.readIssueFieldValues(target, issueNumber) : null;
  const commentRead = comments ? client.readComments(target, issueNumber) : null;
  const reads = [issue, fieldRead, commentRead].filter(Boolean);
  return {
    errors: reads.filter(({ ok }) => !ok).map(({ error }) => error),
    issue: issue.ok ? issue.value : null,
    fields: fieldRead?.ok ? fieldRead.value : [],
    comments: commentRead?.ok ? commentRead.value : []
  };
}

// utils/plan-digest.js
import { createHash } from "crypto";
function planDigest(plan) {
  return `sha256:${createHash("sha256").update(JSON.stringify(plan)).digest("hex")}`;
}
// references/task-management-schema.json
var task_management_schema_default = {
  schemaVersion: "tanaab/task-management-schema/v2",
  issueTypes: [
    { key: "task", name: "Task", enabled: true },
    { key: "bug", name: "Bug", enabled: true },
    { key: "feature", name: "Feature", enabled: true }
  ],
  bodyShapes: {
    task: [
      { heading: "Context", key: "context", level: 2, required: true },
      { heading: "Outcome", key: "outcome", level: 2, required: false },
      { heading: "Scope", key: "scope", level: 2, required: false },
      { heading: "Out of scope", key: "outOfScope", level: 3, required: false },
      {
        heading: "Acceptance criteria",
        key: "acceptanceCriteria",
        level: 2,
        required: true
      },
      {
        heading: "Delivery and verification",
        key: "delivery",
        level: 2,
        required: false
      },
      {
        heading: "Constraints and approvals",
        key: "constraints",
        level: 2,
        required: false
      }
    ],
    bug: [
      {
        heading: "Observed behavior",
        key: "observedBehavior",
        level: 2,
        required: true
      },
      {
        heading: "Expected behavior",
        key: "expectedBehavior",
        level: 2,
        required: true
      },
      {
        heading: "Reproduction or evidence",
        key: "reproduction",
        level: 2,
        required: true
      },
      { heading: "Impact", key: "impactSummary", level: 2, required: false },
      {
        heading: "Delivery and verification",
        key: "delivery",
        level: 2,
        required: false
      },
      {
        heading: "Acceptance criteria",
        key: "acceptanceCriteria",
        level: 2,
        required: true
      },
      {
        heading: "Constraints and approvals",
        key: "constraints",
        level: 2,
        required: false
      }
    ],
    feature: [
      {
        heading: "Problem or opportunity",
        key: "problem",
        level: 2,
        required: true
      },
      {
        heading: "Desired outcome",
        key: "desiredOutcome",
        level: 2,
        required: false
      },
      { heading: "Scope", key: null, level: 2, required: false },
      { heading: "In scope", key: "inScope", level: 3, required: false },
      { heading: "Out of scope", key: "outOfScope", level: 3, required: false },
      {
        heading: "Acceptance criteria",
        key: "acceptanceCriteria",
        level: 2,
        required: true
      },
      {
        heading: "Delivery and verification",
        key: "delivery",
        level: 2,
        required: false
      },
      {
        heading: "Alternatives and constraints",
        key: "alternatives",
        level: 2,
        required: false
      }
    ]
  },
  issueFields: [
    {
      key: "priority",
      name: "Priority",
      dataType: "single_select",
      fallbackKey: "priority",
      options: ["Urgent", "High", "Medium", "Low"],
      visibility: "organization_members_only",
      pinnedIssueTypes: ["Task", "Bug", "Feature"]
    },
    {
      key: "workSize",
      name: "Work size",
      description: "Relative delivery size using 1, 2, 3, 5, 8, 13, and 21.",
      dataType: "single_select",
      fallbackKey: "work-size",
      options: ["1", "2", "3", "5", "8", "13", "21"],
      optionColors: {
        "1": "green",
        "2": "green",
        "3": "green",
        "5": "blue",
        "8": "blue",
        "13": "yellow",
        "21": "red"
      },
      visibility: "organization_members_only",
      pinnedIssueTypes: ["Task", "Bug", "Feature"]
    },
    {
      key: "complexity",
      name: "Complexity",
      description: "Model-neutral reasoning difficulty, ambiguity, novelty, and uncertainty.",
      dataType: "single_select",
      fallbackKey: "complexity",
      options: ["Low", "Medium", "High"],
      optionColors: { Low: "green", Medium: "yellow", High: "pink" },
      visibility: "organization_members_only",
      pinnedIssueTypes: ["Task", "Bug", "Feature"]
    },
    {
      key: "impact",
      name: "Impact",
      description: "Expected local value of completing the task, independent of work size.",
      dataType: "single_select",
      fallbackKey: "impact",
      options: ["Low", "Medium", "High", "Very high"],
      optionColors: {
        Low: "gray",
        Medium: "yellow",
        High: "blue",
        "Very high": "green"
      },
      visibility: "organization_members_only",
      pinnedIssueTypes: ["Task", "Bug", "Feature"]
    },
    {
      key: "startDate",
      name: "Start date",
      dataType: "date",
      fallbackKey: "start-date",
      visibility: "organization_members_only",
      pinnedIssueTypes: ["Task", "Bug", "Feature"]
    },
    {
      key: "targetDate",
      name: "Target date",
      dataType: "date",
      fallbackKey: "target-date",
      visibility: "organization_members_only",
      pinnedIssueTypes: ["Task", "Bug", "Feature"]
    }
  ],
  preservedUnmanagedFields: ["Effort"],
  labels: [
    {
      name: "documentation",
      description: "Documentation is a primary deliverable, not an incidental update",
      color: "5ab0ff"
    },
    {
      name: "breaking change",
      description: "Requires consumers to migrate or coordinate adoption",
      color: "db2777"
    },
    {
      name: "regression",
      description: "Evidence shows previously working behavior now fails or degrades",
      color: "ff667d"
    },
    {
      name: "blocked",
      description: "Work cannot proceed until a documented external blocker clears; dependencies alone do not qualify",
      color: "b4233c"
    },
    {
      name: "needs triage",
      description: "Task kind, actionable scope, or acceptance criteria need clarification",
      color: "ffb000"
    },
    {
      name: "needs reproduction",
      description: "A bug lacks reproduction or diagnostic evidence needed to investigate",
      color: "b67e00"
    },
    {
      name: "good first issue",
      description: "Small, low-complexity, actionable, unblocked work suitable for a first contribution",
      color: "33d3a1"
    },
    {
      name: "help wanted",
      description: "Actionable work for which maintainers explicitly welcome outside contribution",
      color: "00c88a"
    }
  ],
  legacyUnmanagedLabels: ["bug", "enhancement", "duplicate", "invalid", "question", "wontfix"],
  automationOwnedLabels: ["dependencies", "javascript", "github_actions"],
  projectSpecificLabelLimit: 2
};

// skills/task-author/lib/task-author-contract.js
var FALLBACK_SCHEMA_VERSION = "tanaab/task-metadata/v2";
var TASK_KINDS = Object.freeze(Object.fromEntries(task_management_schema_default.issueTypes.map(({ key, name }) => [key, name])));
var METADATA_DEFINITIONS = Object.freeze({
  type: { fieldName: null, fieldType: "issue_type", fallbackKey: "type" },
  ...Object.fromEntries(task_management_schema_default.issueFields.map(({ key, name, dataType, fallbackKey }) => [
    key,
    { fieldName: name, fieldType: dataType, fallbackKey }
  ]))
});
var FALLBACK_KEY_ORDER = Object.freeze([
  "type",
  "priority",
  "work-size",
  "complexity",
  "impact",
  "start-date",
  "target-date"
]);
function fieldOptions(key) {
  return task_management_schema_default.issueFields.find((field) => field.key === key)?.options ?? [];
}
function normalizedOptions(key) {
  return fieldOptions(key).map((value) => value.toLowerCase().replaceAll(" ", "-"));
}
var WORK_SIZES = Object.freeze(fieldOptions("workSize").map(Number));
var PRIORITIES = Object.freeze(normalizedOptions("priority"));
var COMPLEXITIES = Object.freeze(normalizedOptions("complexity"));
var IMPACTS = Object.freeze(normalizedOptions("impact"));
var CANONICAL_LABELS = Object.freeze(Object.fromEntries(task_management_schema_default.labels.map(({ name, color, description }) => [
  name,
  { color, description }
])));
function displayValue(value) {
  if (value === null || value === undefined)
    return null;
  return String(value).split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// skills/task-author/utils/build-replacement-issue-field-values.js
function fieldId(field) {
  return Number(field?.field_id ?? field?.issue_field_id ?? field?.id);
}
function observedValue(field) {
  if (field?.data_type === "single_select") {
    return field.single_select_option?.name ?? field.value;
  }
  return field?.value;
}
function replacement(field, value = observedValue(field)) {
  const id = fieldId(field);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("An issue field value does not expose a writable numeric field id.");
  }
  if (value === undefined) {
    throw new Error(`Issue field ${id} does not expose a preservable value.`);
  }
  return { field_id: id, value };
}
function buildReplacementIssueFieldValues(currentFields = [], desiredWrites = []) {
  const values = new Map(currentFields.map((field) => {
    const entry = replacement(field);
    return [entry.field_id, entry];
  }));
  for (const desired of desiredWrites) {
    const entry = replacement(desired, desired.value);
    values.set(entry.field_id, entry);
  }
  return [...values.values()];
}

// skills/task-author/utils/plan-task-metadata.js
function findNamed(values, name) {
  return values.find((value) => String(value.name).toLowerCase() === name.toLowerCase());
}
function findEnabledIssueType(capabilities, name) {
  return findNamed((capabilities.issueTypes?.values ?? []).filter(({ is_enabled }) => is_enabled !== false), name);
}

// skills/task-author/utils/render-fallback-metadata.js
function yamlScalar(value) {
  if (typeof value === "number")
    return String(value);
  return String(value).toLowerCase().replaceAll(" ", "-");
}
function renderFallbackMetadata(fallback = {}) {
  const lines = FALLBACK_KEY_ORDER.filter((key) => fallback[key] !== undefined && fallback[key] !== null && fallback[key] !== "").map((key) => `  ${key}: ${yamlScalar(fallback[key])}`);
  if (lines.length === 0)
    return "";
  return [
    "### Task metadata",
    "",
    "```yaml",
    `schema: ${FALLBACK_SCHEMA_VERSION}`,
    "mode: fallback",
    "fallback:",
    ...lines,
    "```",
    ""
  ].join(`
`);
}

// skills/task-author/utils/render-migrated-task-body.js
function renderMigratedTaskBody(baseBody, fallback, removedKeys = []) {
  const remaining = Object.fromEntries(Object.entries(fallback).filter(([key]) => !removedKeys.includes(key)));
  const capsule = renderFallbackMetadata(remaining);
  return capsule ? `${String(baseBody).trimEnd()}

${capsule}` : `${String(baseBody).trimEnd()}
`;
}

// skills/task-author/utils/build-fallback-migration-plan.js
function findNamed2(values, name) {
  return values.find((value) => String(value.name).toLowerCase() === String(name).toLowerCase());
}
function fieldValue(field) {
  if (field?.data_type === "single_select")
    return field.single_select_option?.name ?? field.value;
  return field?.value;
}
function comparable(value) {
  return typeof value === "string" ? value.toLowerCase() : value;
}
function labels(issue) {
  return (issue.labels ?? []).map((label) => typeof label === "string" ? label : label.name);
}
function buildFallbackMigrationPlan(target, capabilities, current, parsed) {
  const blockers = [...parsed.errors];
  const conflicts = [];
  const unavailable = [];
  const removableKeys = [];
  const fieldWrites = [];
  const expectedFields = [];
  let typeWrite = null;
  let expectedType = null;
  for (const [fallbackKey, value] of Object.entries(parsed.fallback)) {
    if (fallbackKey === "type") {
      if (capabilities.issueTypes?.status !== "ok") {
        unavailable.push({ key: fallbackKey, reason: "Native issue types are unavailable." });
        continue;
      }
      const desiredName = TASK_KINDS[String(value).toLowerCase()];
      const available = findEnabledIssueType(capabilities, desiredName);
      if (!available) {
        unavailable.push({ key: fallbackKey, reason: `Issue type ${desiredName} is unavailable.` });
        continue;
      }
      const observed = typeof current.issue.type === "string" ? current.issue.type : current.issue.type?.name;
      if (observed && comparable(observed) !== comparable(desiredName)) {
        conflicts.push({ key: fallbackKey, native: observed, fallback: value });
        continue;
      }
      expectedType = desiredName;
      if (!observed)
        typeWrite = desiredName;
      removableKeys.push(fallbackKey);
      continue;
    }
    const entry = Object.entries(METADATA_DEFINITIONS).find(([key, definition]) => key !== "type" && definition.fallbackKey === fallbackKey);
    if (!entry || capabilities.issueFields?.status !== "ok") {
      unavailable.push({ key: fallbackKey, reason: "A compatible native field is unavailable." });
      continue;
    }
    const [, definition] = entry;
    const field = findNamed2(capabilities.issueFields.values, definition.fieldName);
    if (!field || !Number.isSafeInteger(Number(field.id)) || Number(field.id) <= 0 || String(field.data_type).toLowerCase() !== definition.fieldType) {
      unavailable.push({ key: fallbackKey, reason: "A compatible native field is unavailable." });
      continue;
    }
    let desired = value;
    if (definition.fieldType === "single_select") {
      const option = findNamed2(field.options ?? [], displayValue(value));
      if (!option) {
        unavailable.push({
          key: fallbackKey,
          reason: `Native option ${displayValue(value)} is unavailable.`
        });
        continue;
      }
      desired = option.name;
    }
    const observedField = current.fields.find((candidate) => Number(candidate.issue_field_id ?? candidate.field_id ?? candidate.id) === Number(field.id));
    const observed = fieldValue(observedField);
    if (observed !== undefined && observed !== null && comparable(observed) !== comparable(desired)) {
      conflicts.push({ key: fallbackKey, native: observed, fallback: value });
      continue;
    }
    const expected = {
      id: Number(field.id),
      name: field.name,
      type: definition.fieldType,
      value: desired
    };
    expectedFields.push(expected);
    if (observed === undefined || observed === null) {
      fieldWrites.push({ field_id: expected.id, value: expected.value });
    }
    removableKeys.push(fallbackKey);
  }
  const body = renderMigratedTaskBody(parsed.body, parsed.fallback, removableKeys);
  const nativeMutation = {
    ...typeWrite ? { type: typeWrite } : {},
    ...fieldWrites.length > 0 ? {
      issue_field_values: buildReplacementIssueFieldValues(current.fields, fieldWrites)
    } : {}
  };
  const bodyMutation = body === current.issue.body ? {} : { body };
  return {
    blockers,
    plan: {
      target: `${target.slug}#${target.issueNumber}`,
      issue: {
        title: current.issue.title,
        body,
        labels: labels(current.issue),
        ...expectedType ? { type: expectedType } : {}
      },
      phases: [
        { name: "write native values", mutation: nativeMutation },
        { name: "remove verified fallback keys", mutation: bodyMutation }
      ],
      removableKeys,
      conflicts,
      unavailable,
      comments: [],
      expected: { type: expectedType, fields: expectedFields, labels: labels(current.issue) }
    }
  };
}

// utils/evaluate-publication.js
var PUBLICATION_PATTERNS = Object.freeze([
  { name: "private key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { name: "OpenAI API key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { name: "AWS access key", pattern: /\bAKIA[A-Z0-9]{16}\b/ },
  { name: "bearer credential", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/i }
]);
function evaluatePublication({ digest, publication = {}, target, texts }) {
  const publicText = texts.map((value) => String(value ?? "")).join(`
`);
  const findings = PUBLICATION_PATTERNS.filter(({ pattern }) => pattern.test(publicText)).map(({ name }) => name);
  const reasons = [];
  if (findings.length > 0) {
    reasons.push(`Publication text contains possible sensitive material: ${findings.join(", ")}.`);
  }
  if (publication.safetyReviewed !== true) {
    reasons.push("Publication safety review has not been attested.");
  }
  if (publication.approvedTarget !== target) {
    reasons.push(`Publication target must be approved exactly as ${target}.`);
  }
  if (publication.approvedDigest !== digest) {
    reasons.push("Publication approval does not match the exact mutation-plan digest.");
  }
  return {
    approved: reasons.length === 0,
    digest,
    target,
    safetyReviewed: publication.safetyReviewed === true,
    findings,
    reasons
  };
}

// skills/task-author/utils/evaluate-task-publication.js
function publicationText(plan) {
  return [plan.issue.title, plan.issue.body, ...plan.comments.map(({ body }) => body)].join(`
`);
}
function evaluateTaskPublication(plan, digest, publication = {}) {
  return evaluatePublication({
    digest,
    publication,
    target: plan.target,
    texts: [publicationText(plan)]
  });
}

// skills/task-author/utils/normalize-task-target.js
var REPOSITORY_SLUG = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:#([1-9]\d*))?$/;
function normalizeTaskTarget(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("A GitHub repository target is required as OWNER/REPO.");
  }
  let candidate = input.trim();
  if (/^https?:\/\//i.test(candidate)) {
    let url;
    try {
      url = new URL(candidate);
    } catch {
      throw new Error(`Invalid GitHub repository URL: ${candidate}`);
    }
    if (url.hostname.toLowerCase() !== "github.com") {
      throw new Error(`Expected a github.com repository URL, received: ${url.hostname}`);
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 4 && parts[2] === "issues" && /^[1-9]\d*$/.test(parts[3])) {
      candidate = `${parts[0]}/${parts[1].replace(/\.git$/i, "")}#${parts[3]}`;
    } else if (parts.length === 2) {
      candidate = `${parts[0]}/${parts[1].replace(/\.git$/i, "")}`;
    } else {
      throw new Error("Expected a GitHub repository or issue URL.");
    }
  } else {
    candidate = candidate.replace(/\.git(?=#|$)/i, "");
  }
  const match = candidate.match(REPOSITORY_SLUG);
  if (!match) {
    throw new Error(`Expected OWNER/REPO or OWNER/REPO#NUMBER, received: ${input}`);
  }
  const [, owner, repo, issueNumber] = match;
  return {
    owner,
    repo,
    slug: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
    issueNumber: issueNumber ? Number(issueNumber) : null,
    issueUrl: issueNumber ? `https://github.com/${owner}/${repo}/issues/${issueNumber}` : null
  };
}

// skills/task-author/utils/parse-fallback-metadata.js
var CAPSULE = /(?:\n\n)?### Task metadata\n\n```yaml\n([\s\S]*?)```\s*$/;
function scalar(value) {
  if (/^-?\d+$/.test(value))
    return Number(value);
  return value;
}
function parseFallbackMetadata(body = "") {
  const source = String(body);
  const match = source.match(CAPSULE);
  if (!match) {
    return { found: false, body: source, schema: null, fallback: {}, errors: [] };
  }
  const lines = match[1].split(`
`);
  const errors = [];
  const fallback = {};
  let inFallback = false;
  let schema = null;
  let mode = null;
  for (const line of lines) {
    if (line.startsWith("schema: "))
      schema = line.slice(8).trim();
    else if (line.startsWith("mode: "))
      mode = line.slice(6).trim();
    else if (line === "fallback:")
      inFallback = true;
    else if (inFallback && /^ {2}[a-z-]+: /.test(line)) {
      const separator = line.indexOf(":", 2);
      const key = line.slice(2, separator);
      const value = line.slice(separator + 1).trim();
      if (FALLBACK_KEY_ORDER.includes(key))
        fallback[key] = scalar(value);
      else
        errors.push(`Unsupported fallback key: ${key}.`);
    } else if (line.trim()) {
      errors.push(`Unsupported fallback capsule line: ${line.trim()}`);
    }
  }
  if (schema !== FALLBACK_SCHEMA_VERSION) {
    errors.push(`Fallback schema must be ${FALLBACK_SCHEMA_VERSION}.`);
  }
  if (mode !== "fallback")
    errors.push("Fallback capsule mode must be fallback.");
  if (!inFallback)
    errors.push("Fallback capsule is missing fallback:.");
  return {
    found: true,
    body: source.slice(0, match.index).trimEnd(),
    schema,
    fallback,
    errors
  };
}

// skills/task-author/lib/task-observation.js
function observedIssueTypeName(issue) {
  return typeof issue?.type === "string" ? issue.type : issue?.type?.name ?? null;
}
function observedLabelNames(labels = []) {
  if (!Array.isArray(labels))
    return [];
  return labels.map((label) => typeof label === "string" ? label : label?.name).filter(Boolean);
}
function observedIssueFieldValue(field) {
  if (field?.single_select_option?.name !== undefined)
    return field.single_select_option.name;
  return field?.value;
}

// skills/task-author/utils/verify-created-task.js
function check(key, expected, actual) {
  return {
    key,
    status: JSON.stringify(actual) === JSON.stringify(expected) ? "verified" : "drifted",
    expected,
    actual
  };
}
function verifyCreatedTask(plan, { issue, fields = [], comments = [] } = {}) {
  const checks = [
    check("title", plan.issue.title, issue?.title ?? null),
    check("body", plan.issue.body, issue?.body ?? null),
    check("labels", [...plan.expected.labels].map((label) => label.toLowerCase()).sort(), observedLabelNames(issue?.labels).map((label) => label.toLowerCase()).sort())
  ];
  if (plan.expected.type) {
    checks.push(check("type", plan.expected.type.toLowerCase(), observedIssueTypeName(issue)?.toLowerCase() ?? null));
  }
  for (const expected of plan.expected.fields) {
    const observed = fields.find((field) => Number(field.issue_field_id ?? field.field_id ?? field.id) === expected.id);
    const actual = observedIssueFieldValue(observed);
    const normalizedExpected = expected.type === "single_select" ? String(expected.value).toLowerCase() : expected.value;
    const normalizedActual = expected.type === "single_select" && actual !== undefined && actual !== null ? String(actual).toLowerCase() : actual ?? null;
    checks.push(check(`field:${expected.name}`, normalizedExpected, normalizedActual));
  }
  const observedComments = new Set(comments.map(({ body }) => body));
  for (const expected of plan.comments) {
    checks.push(check(`comment:${expected.kind}`, expected.body, observedComments.has(expected.body) ? expected.body : null));
  }
  return {
    status: checks.every(({ status }) => status === "verified") ? "verified" : "drifted",
    checks,
    mismatches: checks.filter(({ status }) => status !== "verified")
  };
}

// skills/task-author/lib/task-fallback-migrator.js
function phaseHasMutation(phase) {
  return Object.keys(phase.mutation).length > 0;
}
function migrateTaskFallback(input = {}, { githubClient = new GitHubTaskClient } = {}) {
  githubClient.ensureAvailable();
  const target = normalizeTaskTarget(input.target);
  if (!target.issueNumber)
    throw new Error("Fallback migration requires OWNER/REPO#NUMBER.");
  const capabilities = githubClient.inspectRepository(target);
  const fields = capabilities.issueFields.status !== "not_applicable";
  const current = readTaskState(githubClient, target, { fields });
  const parsed = parseFallbackMetadata(current.issue?.body ?? "");
  const { blockers: planBlockers, plan } = buildFallbackMigrationPlan(target, capabilities, current, parsed);
  const digest = planDigest(plan);
  const publication = evaluateTaskPublication(plan, digest, input.publication);
  const blockers = [...current.errors, ...planBlockers];
  if (!parsed.found)
    blockers.push("The issue body has no recognized fallback capsule.");
  const base = {
    mode: "migrate_fallback",
    target,
    current,
    plannedMutation: plan,
    publication,
    capabilities
  };
  if (blockers.length > 0) {
    return {
      ...base,
      status: "blocked",
      mutatesGitHub: false,
      blockers,
      writes: [],
      verification: null
    };
  }
  if (!plan.phases.some(phaseHasMutation)) {
    return {
      ...base,
      status: plan.conflicts.length > 0 || plan.unavailable.length > 0 ? "partial" : "aligned",
      mutatesGitHub: false,
      blockers: [],
      writes: [],
      verification: verifyCreatedTask(plan, current)
    };
  }
  if (!publication.approved) {
    return {
      ...base,
      status: publication.findings.length > 0 ? "publication_blocked" : "approval_required",
      mutatesGitHub: false,
      blockers: [],
      writes: [],
      verification: null
    };
  }
  const writes = [];
  const nativePhase = plan.phases[0];
  if (phaseHasMutation(nativePhase)) {
    const result = githubClient.updateIssue(target, target.issueNumber, nativePhase.mutation);
    writes.push(result.ok ? { operation: nativePhase.name, status: "succeeded" } : { operation: nativePhase.name, status: "failed", error: result.error });
    if (!result.ok) {
      return {
        ...base,
        status: "failed",
        mutatesGitHub: false,
        blockers: [],
        writes,
        verification: null
      };
    }
  }
  const nativeObserved = readTaskState(githubClient, target, { fields });
  const nativePlan = {
    ...plan,
    issue: { ...plan.issue, body: nativeObserved.issue?.body ?? null },
    expected: { ...plan.expected, labels: plan.expected.labels }
  };
  const nativeVerification = nativeObserved.issue ? verifyCreatedTask(nativePlan, nativeObserved) : { status: "unavailable", checks: [], mismatches: [] };
  const nativeManagedMismatches = nativeVerification.mismatches.filter(({ key }) => key === "type" || key.startsWith("field:"));
  if (nativeObserved.errors.length > 0 || nativeManagedMismatches.length > 0) {
    nativeVerification.errors = nativeObserved.errors;
    return {
      ...base,
      status: "partial",
      mutatesGitHub: writes.length > 0,
      blockers: [],
      writes,
      verification: nativeVerification
    };
  }
  const bodyPhase = plan.phases[1];
  if (phaseHasMutation(bodyPhase)) {
    const result = githubClient.updateIssue(target, target.issueNumber, bodyPhase.mutation);
    writes.push(result.ok ? { operation: bodyPhase.name, status: "succeeded" } : { operation: bodyPhase.name, status: "failed", error: result.error });
  }
  const observed = readTaskState(githubClient, target, { fields });
  const verification = observed.issue ? verifyCreatedTask(plan, observed) : { status: "unavailable", checks: [], mismatches: [] };
  verification.errors = observed.errors;
  const complete = writes.every(({ status }) => status === "succeeded") && verification.status === "verified" && observed.errors.length === 0;
  return {
    ...base,
    status: complete ? plan.conflicts.length > 0 || plan.unavailable.length > 0 ? "partial" : "migrated" : "partial",
    mutatesGitHub: writes.length > 0,
    blockers: [],
    writes,
    verification
  };
}

// skills/task-author/lib/task-json-command.js
import { readFileSync } from "fs";
var TASK_JSON_INPUT_GUIDANCE = `Agents should prefer --input - and send JSON through standard input.
If standard input is unavailable, use a repository-local ignored scratch path under the
active workspace only after verifying the intended path with git check-ignore. Do not use an
operating-system or user-level temporary directory for request JSON.`;
function runTaskJsonCommand(argv, { errorPrefix, execute, failureStatuses = [], usage }, { readFile = readFileSync, stderr = process.stderr, stdout = process.stdout } = {}) {
  try {
    if (argv.includes("--help") || argv.includes("-h")) {
      stdout.write(`${usage()}
`);
      return 0;
    }
    const inputIndex = argv.indexOf("--input");
    if (inputIndex === -1 || !argv[inputIndex + 1]) {
      throw new Error("--input <path|-> is required.");
    }
    const inputPath = argv[inputIndex + 1];
    const source = inputPath === "-" ? readFile(0, "utf8") : readFile(inputPath, "utf8");
    const result = execute(JSON.parse(source));
    stdout.write(`${JSON.stringify(result, null, 2)}
`);
    return failureStatuses.includes(result.status) ? 1 : 0;
  } catch (error) {
    stderr.write(`${errorPrefix}: ${error.message}
`);
    return 1;
  }
}

// skills/task-author/scripts/migrate-fallback.js
function usage() {
  return `Usage: bun "${process.argv[1]}" --input <path|->

Preview and apply one separately bounded fallback migration through exact target and digest
approval. An agent may inspect and apply both passes in one turn after an explicit migration
imperative when the preview contains no material surprise.

${TASK_JSON_INPUT_GUIDANCE}`;
}
process.exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: "Task Author fallback migration failed",
  execute: migrateTaskFallback,
  failureStatuses: ["blocked", "publication_blocked", "partial", "failed"],
  usage
});
