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

// skills/task-author/utils/build-task-assessment.js
var ASSESSMENT_KEYS = Object.freeze([
  "priority",
  "workSize",
  "complexity",
  "impact",
  "startDate",
  "targetDate"
]);
var SOURCES = Object.freeze(["agent", "human", "policy", "existing"]);
var HUMAN_CONTROLLED = new Set(["priority", "startDate", "targetDate"]);
function normalizedRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record))
    return null;
  return {
    source: String(record.source ?? "").trim().toLowerCase(),
    rationale: String(record.rationale ?? "").trim()
  };
}
function effectiveValues(metadata) {
  return Object.fromEntries(ASSESSMENT_KEYS.flatMap((key) => metadata[key] === undefined ? [] : [[key, metadata[key]]]));
}
function buildTaskAssessment(metadata = {}, input = {}) {
  const errors = [];
  const values = {};
  const effective = effectiveValues(metadata);
  for (const key of Object.keys(input ?? {})) {
    if (!ASSESSMENT_KEYS.includes(key))
      errors.push(`assessment.${key} is not supported.`);
  }
  for (const [key, value] of Object.entries(effective)) {
    const record = normalizedRecord(input?.[key]);
    if (!record) {
      errors.push(`assessment.${key} requires source and rationale provenance.`);
      continue;
    }
    if (!SOURCES.includes(record.source)) {
      errors.push(`assessment.${key}.source must be one of: ${SOURCES.join(", ")}.`);
    }
    if (record.source === "agent" && !record.rationale) {
      errors.push(`assessment.${key}.rationale is required for an agent estimate.`);
    }
    if (HUMAN_CONTROLLED.has(key) && record.source === "agent") {
      errors.push(`${key} is human- or policy-controlled and cannot be authored as an agent estimate.`);
    }
    values[key] = { value, ...record };
  }
  for (const key of ASSESSMENT_KEYS) {
    if (input?.[key] !== undefined && effective[key] === undefined) {
      errors.push(`assessment.${key} cannot describe an unset value.`);
    }
  }
  return { values, errors };
}

// skills/task-author/utils/classify-task-labels.js
function classifyTaskLabels({
  kind = null,
  metadata = {},
  signals = {},
  actionable = false,
  hasAcceptanceCriteria = false,
  reproductionAvailable = null,
  availableLabels = null,
  relationships = {}
} = {}) {
  const desired = [];
  const warnings = [];
  const add = (label) => {
    if (!desired.includes(label))
      desired.push(label);
  };
  if (signals.documentation === true)
    add("documentation");
  if (signals.breakingChange === true)
    add("breaking change");
  if (kind === "bug" && signals.regression === true)
    add("regression");
  const blocked = signals.blocked === true || relationships.externalBlocker === true;
  if (blocked)
    add("blocked");
  const needsTriage = signals.needsTriage === true || !kind || !actionable || !hasAcceptanceCriteria;
  if (needsTriage)
    add("needs triage");
  if (kind === "bug" && reproductionAvailable === false)
    add("needs reproduction");
  const eligibleFirstIssue = signals.goodFirstIssue === true && actionable && hasAcceptanceCriteria && !needsTriage && !blocked && metadata.complexity === "low" && [1, 2, 3].includes(metadata.workSize);
  if (eligibleFirstIssue)
    add("good first issue");
  else if (signals.goodFirstIssue === true) {
    warnings.push("good first issue was not proposed because its eligibility rules are not met.");
  }
  const eligibleHelpWanted = signals.helpWanted === true && actionable && hasAcceptanceCriteria && !needsTriage;
  if (eligibleHelpWanted)
    add("help wanted");
  else if (signals.helpWanted === true) {
    warnings.push("help wanted was not proposed because the task is not fully actionable and triaged.");
  }
  const known = Array.isArray(availableLabels) ? new Set(availableLabels.map((label) => (typeof label === "string" ? label : label.name).toLowerCase())) : null;
  const apply = known ? desired.filter((label) => known.has(label)) : [];
  const missing = known ? desired.filter((label) => !known.has(label)) : [];
  const unresolved = known ? [] : [...desired];
  if (missing.length > 0) {
    warnings.push(`Canonical label definitions are absent and will not be created: ${missing.join(", ")}.`);
  }
  if (unresolved.length > 0) {
    warnings.push("Repository label availability could not be verified; label plans remain unresolved.");
  }
  return {
    desired: desired.filter((label) => Object.hasOwn(CANONICAL_LABELS, label)),
    apply,
    missing,
    unresolved,
    warnings
  };
}

// skills/task-author/utils/normalize-task-kind.js
function normalizeTaskKind(input) {
  if (input === null || input === undefined || String(input).trim() === "")
    return null;
  const value = String(input).trim().toLowerCase();
  if (!Object.hasOwn(TASK_KINDS, value)) {
    throw new Error(`Unsupported task kind: ${input}. Expected Task, Bug, or Feature.`);
  }
  return value;
}

// skills/task-author/utils/normalize-task-metadata.js
var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
var METADATA_KEYS = Object.freeze([
  "priority",
  "workSize",
  "complexity",
  "impact",
  "startDate",
  "targetDate"
]);
function normalizedEnum(value) {
  return typeof value === "string" ? value.trim().toLowerCase().replaceAll(" ", "-") : value;
}
function validateEnum(values, key, allowed, errors) {
  if (values[key] === null || values[key] === undefined || values[key] === "") {
    delete values[key];
    return;
  }
  values[key] = normalizedEnum(values[key]);
  if (!allowed.includes(values[key])) {
    errors.push(`${key} must be one of: ${allowed.join(", ")}.`);
  }
}
function validateDate(values, key, errors) {
  if (values[key] === null || values[key] === undefined || values[key] === "") {
    delete values[key];
    return;
  }
  const value = String(values[key]).trim();
  const parsed = new Date(`${value}T00:00:00Z`);
  const isExactDate = DATE_PATTERN.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  if (!isExactDate) {
    errors.push(`${key} must be a valid ISO YYYY-MM-DD date.`);
  }
  values[key] = value;
}
function normalizeTaskMetadata(input = {}) {
  const values = Object.fromEntries(METADATA_KEYS.filter((key) => input?.[key] !== undefined).map((key) => [key, input[key]]));
  const errors = Object.keys(input ?? {}).filter((key) => !METADATA_KEYS.includes(key)).map((key) => `metadata.${key} is not supported.`);
  validateEnum(values, "priority", PRIORITIES, errors);
  validateEnum(values, "complexity", COMPLEXITIES, errors);
  validateEnum(values, "impact", IMPACTS, errors);
  if (values.workSize === null || values.workSize === undefined || values.workSize === "") {
    delete values.workSize;
  } else {
    values.workSize = Number(values.workSize);
    if (!WORK_SIZES.includes(values.workSize)) {
      errors.push(`workSize must be one of: ${WORK_SIZES.join(", ")}.`);
    }
  }
  validateDate(values, "startDate", errors);
  validateDate(values, "targetDate", errors);
  return { errors, values };
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

// skills/task-author/utils/plan-task-metadata.js
function normalizeFieldType(field) {
  return String(field.data_type ?? field.type ?? field.field_type ?? "").toLowerCase().replaceAll("-", "_");
}
function findNamed(values, name) {
  return values.find((value) => String(value.name).toLowerCase() === name.toLowerCase());
}
function findEnabledIssueType(capabilities, name) {
  return findNamed((capabilities.issueTypes?.values ?? []).filter(({ is_enabled }) => is_enabled !== false), name);
}
function planTaskMetadata(kind, values = {}, capabilities = {}, { forceFallbackKeys = [] } = {}) {
  const native = { type: null, fields: [] };
  const fallback = {};
  const unresolved = [];
  const warnings = [];
  const forced = new Set(forceFallbackKeys);
  if (kind) {
    const kindDisplay = TASK_KINDS[kind];
    if (forced.has("type")) {
      fallback.type = kind;
    } else if (capabilities.issueTypes?.status === "ok") {
      const issueType = findEnabledIssueType(capabilities, kindDisplay);
      if (issueType)
        native.type = { id: issueType.id ?? null, name: issueType.name };
      else
        fallback.type = kind;
    } else if (capabilities.issueTypes?.status === "not_applicable") {
      fallback.type = kind;
    } else {
      unresolved.push({ key: "type", value: kind, reason: "issue type availability is unknown" });
    }
  }
  for (const [key, definition] of Object.entries(METADATA_DEFINITIONS)) {
    if (key === "type" || values[key] === undefined)
      continue;
    const value = values[key];
    const status = capabilities.issueFields?.status;
    if (forced.has(definition.fallbackKey)) {
      fallback[definition.fallbackKey] = value;
      continue;
    }
    if (status === "not_applicable") {
      fallback[definition.fallbackKey] = value;
      continue;
    }
    const field = status === "ok" && findNamed(capabilities.issueFields.values ?? [], definition.fieldName);
    if (status !== "ok" || !field && capabilities.issueFields.complete === false) {
      unresolved.push({
        key: definition.fallbackKey,
        value,
        reason: "issue field availability is unknown"
      });
      continue;
    }
    if (!field) {
      fallback[definition.fallbackKey] = value;
      continue;
    }
    if (normalizeFieldType(field) !== definition.fieldType) {
      fallback[definition.fallbackKey] = value;
      warnings.push(`${definition.fieldName} has incompatible type ${normalizeFieldType(field) || "unknown"}; using fallback metadata.`);
      continue;
    }
    let nativeValue = value;
    if (!Number.isSafeInteger(Number(field.id)) || Number(field.id) <= 0) {
      unresolved.push({
        key: definition.fallbackKey,
        value,
        reason: "issue field ID is unavailable"
      });
      continue;
    }
    if (definition.fieldType === "single_select") {
      const options = field.options ?? field.settings?.options;
      if (!Array.isArray(options) || options.some((option) => !option?.name)) {
        unresolved.push({
          key: definition.fallbackKey,
          value,
          reason: "issue field options are unavailable"
        });
        continue;
      }
      const option = findNamed(options, displayValue(value));
      if (!option) {
        fallback[definition.fallbackKey] = value;
        warnings.push(`${definition.fieldName} lacks option ${displayValue(value)}; using fallback metadata.`);
        continue;
      }
      nativeValue = { id: option.id ?? null, name: option.name };
    }
    native.fields.push({
      id: field.id ?? null,
      name: field.name,
      type: definition.fieldType,
      value: nativeValue
    });
  }
  return { native, fallback, unresolved, warnings };
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

// skills/task-author/utils/render-task-body.js
var BODY_SHAPES = Object.freeze(task_management_schema_default.bodyShapes);
function present(value) {
  return Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.trim() !== "";
}
function renderValue(key, value) {
  if (!present(value))
    return "";
  if (key === "acceptanceCriteria") {
    return value.map((item) => `- [ ] ${String(item).trim()}`).join(`
`);
  }
  return Array.isArray(value) ? value.map((item) => `- ${String(item).trim()}`).join(`
`) : String(value).trim();
}
function hasChildContent(shape, index, sections) {
  for (const child of shape.slice(index + 1)) {
    if (child.level <= shape[index].level)
      break;
    if (present(sections[child.key]))
      return true;
  }
  return false;
}
function renderTaskBody(kind, sections = {}) {
  if (!BODY_SHAPES[kind])
    throw new Error(`Cannot render body for unsupported task kind: ${kind}`);
  const missing = [];
  const blocks = [];
  const shape = BODY_SHAPES[kind];
  for (const [index, { heading, key, level = 2, required = true }] of shape.entries()) {
    const value = key === null ? undefined : sections[key];
    if (!required && !present(value) && !hasChildContent(shape, index, sections))
      continue;
    if (required && !present(value))
      missing.push(key);
    let content = renderValue(key, value);
    if (kind === "bug" && key === "reproduction" && present(sections.environment)) {
      content = [content, `### Environment

${renderValue("environment", sections.environment)}`].filter(Boolean).join(`

`);
    }
    blocks.push(`${"#".repeat(level)} ${heading}

${content}`.trimEnd());
  }
  return { body: `${blocks.join(`

`)}
`, missing };
}

// skills/task-author/lib/task-draft-author.js
function appendBlock(body, block) {
  if (!block)
    return body;
  return `${body.trimEnd()}

${block.trimStart()}`;
}
function authorTaskDraft(input = {}, { githubClient = new GitHubCapabilityClient } = {}) {
  const warnings = [];
  warnings.push(...githubClient.ensureAvailable());
  const resolvedInput = input.target ?? githubClient.resolveCurrentRepository();
  if (!resolvedInput) {
    throw new Error("The GitHub repository target is ambiguous or unavailable. Supply an explicit OWNER/REPO.");
  }
  const target = normalizeTaskTarget(resolvedInput);
  const capabilities = githubClient.inspectRepository(target);
  warnings.push(...capabilities.warnings);
  const kind = normalizeTaskKind(input.kind);
  const metadataResult = normalizeTaskMetadata(input.metadata);
  const assessment = buildTaskAssessment(metadataResult.values, input.assessment);
  const renderedBody = kind ? renderTaskBody(kind, input.sections) : { body: String(input.originalBody ?? ""), missing: ["kind"] };
  const acceptanceCriteria = input.sections?.acceptanceCriteria;
  const hasAcceptanceCriteria = Array.isArray(acceptanceCriteria) && acceptanceCriteria.some((item) => String(item).trim());
  const actionable = input.actionable ?? (kind !== null && renderedBody.missing.length === 0);
  const metadataPlan = planTaskMetadata(kind, metadataResult.values, capabilities, {
    forceFallbackKeys: input.forceFallbackKeys
  });
  const fallbackBlock = renderFallbackMetadata(metadataPlan.fallback);
  const body = appendBlock(renderedBody.body, fallbackBlock);
  const availableLabels = capabilities.labels.status === "ok" ? capabilities.labels.values : null;
  const labels = classifyTaskLabels({
    kind,
    metadata: metadataResult.values,
    signals: input.signals,
    actionable,
    hasAcceptanceCriteria,
    reproductionAvailable: input.reproductionAvailable,
    availableLabels,
    relationships: input.relationships
  });
  warnings.push(...metadataPlan.warnings, ...labels.warnings);
  if (metadataResult.values.workSize === 13) {
    warnings.push("Work size 13 requires an explicit decomposition review before execution.");
  } else if (metadataResult.values.workSize === 21) {
    warnings.push("Work size 21 is oversized and should normally be an acknowledged parent or planning task before decomposition.");
  }
  const comments = [];
  const needsInput = !kind || !String(input.title ?? "").trim() || renderedBody.missing.length > 0 || metadataResult.errors.length > 0 || assessment.errors.length > 0 || !actionable;
  const incompleteCapabilities = warnings.length > 0 || metadataPlan.unresolved.length > 0 || labels.missing.length > 0 || labels.unresolved.length > 0;
  return {
    mode: "draft",
    mutatesGitHub: false,
    status: needsInput ? "needs_input" : incompleteCapabilities ? "partial" : "ready",
    target,
    title: String(input.title ?? "").trim(),
    taskKind: kind ? { key: kind, name: TASK_KINDS[kind] } : null,
    body,
    bodyEvidence: { missing: renderedBody.missing },
    metadata: {
      values: metadataResult.values,
      native: metadataPlan.native,
      fallback: metadataPlan.fallback,
      unresolved: metadataPlan.unresolved,
      errors: metadataResult.errors,
      warnings: metadataPlan.warnings
    },
    assessment,
    labels,
    relationships: input.relationships ?? {},
    comments,
    capabilities,
    questions: input.questions ?? [],
    warnings,
    operations: ["read repository", "read issue types", "read issue fields", "read labels"]
  };
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

// skills/task-author/utils/build-task-create-plan.js
function nativeFieldValue(field) {
  if (field.type === "single_select")
    return field.value?.name ?? field.value;
  return field.value;
}
function buildTaskCreatePlan(draft) {
  const errors = [];
  const issueFieldValues = draft.metadata.native.fields.map((field) => {
    const fieldId = Number(field.id);
    if (!Number.isInteger(fieldId) || fieldId <= 0) {
      errors.push(`Native issue field ${field.name} does not expose a writable numeric id.`);
    }
    return {
      field_id: fieldId,
      value: nativeFieldValue(field)
    };
  });
  const issue = {
    title: draft.title,
    body: draft.body
  };
  if (draft.metadata.native.type)
    issue.type = draft.metadata.native.type.name;
  if (draft.labels.apply.length > 0)
    issue.labels = [...draft.labels.apply];
  if (issueFieldValues.length > 0)
    issue.issue_field_values = issueFieldValues;
  return {
    errors,
    plan: {
      target: draft.target.slug,
      issue,
      comments: draft.comments.map(({ kind, body }) => ({ kind, body })),
      expected: {
        type: draft.metadata.native.type?.name ?? null,
        fields: draft.metadata.native.fields.map((field, index) => ({
          id: issueFieldValues[index].field_id,
          name: field.name,
          type: field.type,
          value: issueFieldValues[index].value
        })),
        labels: [...draft.labels.apply]
      }
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

// skills/task-author/lib/task-create-author.js
function blockedDraft(draft, input, planErrors) {
  const reasons = [...planErrors];
  if (draft.status === "needs_input")
    reasons.push("The task draft still requires input.");
  if (draft.metadata.unresolved.length > 0) {
    reasons.push("Native-versus-fallback metadata placement remains unresolved.");
  }
  if (draft.labels.unresolved.length > 0) {
    reasons.push("Requested label availability remains unresolved.");
  }
  if (draft.target.issueNumber !== null) {
    reasons.push("Create mode requires a repository target without an issue number.");
  }
  if (Object.keys(draft.relationships).length > 0) {
    reasons.push("Relationship writes are not supported by the current create mode.");
  }
  if ((input.assignees?.length ?? 0) > 0 || input.milestone !== undefined) {
    reasons.push("Assignee and milestone writes are not supported by the current create mode.");
  }
  return reasons;
}
function baseReport(draft, plan, publication) {
  return {
    mode: "create",
    target: draft.target,
    title: draft.title,
    taskKind: draft.taskKind,
    body: draft.body,
    metadata: draft.metadata,
    assessment: draft.assessment,
    labels: draft.labels,
    comments: draft.comments,
    capabilities: draft.capabilities,
    plannedMutation: plan,
    publication,
    warnings: [...draft.warnings]
  };
}
function createTask(input = {}, { githubClient = new GitHubTaskClient } = {}) {
  const draft = authorTaskDraft(input, { githubClient });
  const { errors: planErrors, plan } = buildTaskCreatePlan(draft);
  const digest = planDigest(plan);
  const publication = evaluateTaskPublication(plan, digest, input.publication);
  const blockers = blockedDraft(draft, input, planErrors);
  const report = baseReport(draft, plan, publication);
  if (blockers.length > 0) {
    return {
      ...report,
      status: "blocked",
      mutatesGitHub: false,
      blockers,
      issue: null,
      writes: [],
      verification: null,
      operations: [...draft.operations]
    };
  }
  if (!publication.approved) {
    return {
      ...report,
      status: publication.findings.length > 0 ? "publication_blocked" : "approval_required",
      mutatesGitHub: false,
      blockers: [],
      issue: null,
      writes: [],
      verification: null,
      operations: [...draft.operations]
    };
  }
  const writes = [];
  const creation = githubClient.createIssue(draft.target, plan.issue);
  if (!creation.ok) {
    return {
      ...report,
      status: "failed",
      mutatesGitHub: false,
      blockers: [],
      issue: null,
      writes: [{ operation: "create issue", status: "failed", error: creation.error }],
      verification: null,
      operations: [...draft.operations, "create issue"]
    };
  }
  const issue = {
    number: creation.value.number ?? null,
    url: creation.value.html_url ?? null
  };
  writes.push({ operation: "create issue", status: "succeeded" });
  if (!issue.number) {
    return {
      ...report,
      status: "partial",
      mutatesGitHub: true,
      blockers: [],
      issue,
      writes,
      verification: {
        status: "unavailable",
        checks: [],
        mismatches: [],
        errors: [
          "GitHub created an issue but did not return its number; verification cannot continue."
        ]
      },
      operations: [...draft.operations, "create issue"]
    };
  }
  for (const comment of plan.comments) {
    const result = githubClient.addComment(draft.target, issue.number, comment.body);
    writes.push(result.ok ? { operation: `post ${comment.kind} comment`, status: "succeeded" } : { operation: `post ${comment.kind} comment`, status: "failed", error: result.error });
  }
  const observed = readTaskState(githubClient, draft.target, {
    comments: plan.comments.length > 0,
    fields: plan.expected.fields.length > 0,
    issueNumber: issue.number
  });
  const verification = observed.issue ? verifyCreatedTask(plan, observed) : { status: "unavailable", checks: [], mismatches: [] };
  verification.errors = observed.errors;
  const failedWrites = writes.some(({ status }) => status === "failed");
  const complete = !failedWrites && verification.status === "verified" && observed.errors.length === 0;
  return {
    ...report,
    status: complete ? "created" : "partial",
    mutatesGitHub: true,
    blockers: [],
    issue,
    writes,
    verification,
    operations: [
      ...draft.operations,
      "create issue",
      ...plan.comments.map(({ kind }) => `post ${kind} comment`),
      "re-read issue",
      ...plan.expected.fields.length > 0 ? ["re-read issue fields"] : [],
      ...plan.comments.length > 0 ? ["re-read comments"] : []
    ]
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

// skills/task-author/scripts/create-task.js
function usage() {
  return `Usage: bun "${process.argv[1]}" --input <path|->

Read a JSON Task Author request, print the exact publication plan, and create only when
publication.safetyReviewed, publication.approvedTarget, and publication.approvedDigest
match that plan. Run once without approval to obtain the digest. An agent may inspect and
apply both passes in one turn when an explicit imperative already authorizes the bounded plan.

${TASK_JSON_INPUT_GUIDANCE}`;
}
process.exitCode = runTaskJsonCommand(process.argv.slice(2), {
  errorPrefix: "Task Author create failed",
  execute: createTask,
  failureStatuses: ["blocked", "publication_blocked", "partial", "failed"],
  usage
});
