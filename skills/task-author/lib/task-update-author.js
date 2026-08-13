import { GitHubTaskClient } from './github-task-client.js';
import { authorTaskDraft } from './task-draft-author.js';
import { buildTaskUpdatePlan } from '../utils/build-task-update-plan.js';
import { taskCreatePlanDigest } from '../utils/build-task-create-plan.js';
import { evaluateTaskPublication } from '../utils/evaluate-task-publication.js';
import { parseFallbackMetadata } from '../utils/parse-fallback-metadata.js';
import { verifyCreatedTask } from '../utils/verify-created-task.js';

const FALLBACK_TO_METADATA = Object.freeze({
  priority: 'priority',
  'work-size': 'workSize',
  complexity: 'complexity',
  impact: 'impact',
  'task-score': 'taskScore',
  'start-date': 'startDate',
  'target-date': 'targetDate',
});

function currentLabelNames(issue) {
  return new Set(
    (issue.labels ?? []).map((label) =>
      (typeof label === 'string' ? label : label.name).toLowerCase(),
    ),
  );
}

function preservedSignals(issue, inputSignals = {}) {
  const names = currentLabelNames(issue);
  return {
    documentation: names.has('documentation'),
    breakingChange: names.has('breaking change'),
    regression: names.has('regression'),
    blocked: names.has('blocked'),
    needsTriage: names.has('needs triage'),
    goodFirstIssue: names.has('good first issue'),
    helpWanted: names.has('help wanted'),
    ...inputSignals,
  };
}

function preservedFallbackInput(parsed, input) {
  const metadata = {};
  const assessment = {};
  for (const [fallbackKey, value] of Object.entries(parsed.fallback)) {
    const key = FALLBACK_TO_METADATA[fallbackKey];
    if (key && key !== 'taskScore') {
      metadata[key] = value;
      assessment[key] = {
        source: 'existing',
        rationale: `Preserved from the existing ${fallbackKey} fallback value.`,
      };
    }
  }
  for (const key of Object.keys(input.metadata ?? {})) delete assessment[key];
  return {
    ...input,
    kind: input.kind ?? parsed.fallback.type,
    metadata: { ...metadata, ...input.metadata },
    assessment: { ...assessment, ...input.assessment },
    preservedTaskScore: parsed.fallback['task-score'],
  };
}

function readCurrent(client, target) {
  const issue = client.readIssue(target, target.issueNumber);
  const fields = client.readIssueFieldValues(target, target.issueNumber);
  const comments = client.readComments(target, target.issueNumber);
  const errors = [issue, fields, comments].filter(({ ok }) => !ok).map(({ error }) => error);
  return {
    errors,
    issue: issue.ok ? issue.value : null,
    fields: fields.ok ? fields.value : [],
    comments: comments.ok ? comments.value : [],
  };
}

function reportBase(mode, draft, current, plan, publication) {
  return {
    mode,
    target: draft.target,
    current,
    title: draft.title,
    taskKind: draft.taskKind,
    body: draft.body,
    metadata: draft.metadata,
    assessment: draft.assessment,
    labels: draft.labels,
    scoring: draft.scoring,
    plannedMutation: plan,
    publication,
    warnings: draft.warnings,
  };
}

/** Revise or semantically normalize one issue through an exact digest-gated PATCH. */
export function updateTask(input = {}, { githubClient = new GitHubTaskClient() } = {}) {
  const mode = input.mode ?? 'revise';
  if (!['revise', 'normalize'].includes(mode)) {
    throw new Error('Task update mode must be revise or normalize.');
  }

  const targetInput = input.target ?? githubClient.resolveCurrentRepository();
  const draftTarget = targetInput && String(targetInput).includes('#') ? targetInput : null;
  if (!draftTarget) throw new Error('Task update requires an explicit OWNER/REPO#NUMBER target.');

  const provisional = authorTaskDraft(
    { ...input, target: draftTarget, title: input.title ?? 'read-current-title' },
    { githubClient },
  );
  const current = readCurrent(githubClient, provisional.target);
  if (current.errors.length > 0 || !current.issue) {
    return {
      mode,
      target: provisional.target,
      status: 'blocked',
      mutatesGitHub: false,
      blockers: current.errors,
      current,
      writes: [],
      verification: null,
    };
  }

  const parsed = parseFallbackMetadata(current.issue.body ?? '');
  const preserved = preservedFallbackInput(parsed, input);
  const labels = currentLabelNames(current.issue);
  const draft = authorTaskDraft(
    {
      ...preserved,
      target: draftTarget,
      title: input.title ?? current.issue.title,
      originalBody: input.originalBody ?? current.issue.body,
      forceFallbackKeys: Object.keys(parsed.fallback),
      signals: preservedSignals(current.issue, input.signals),
      reproductionAvailable:
        input.reproductionAvailable ?? (labels.has('needs reproduction') ? false : null),
    },
    { githubClient },
  );
  const { errors: planErrors, plan } = buildTaskUpdatePlan(draft, current, {
    revisionSummary: input.revisionSummary,
  });
  const digest = taskCreatePlanDigest(plan);
  const publication = evaluateTaskPublication(plan, digest, input.publication);
  const blockers = [...current.errors, ...parsed.errors, ...planErrors];
  if (draft.metadata.unresolved.length > 0) blockers.push('Metadata placement remains unresolved.');
  if (draft.labels.unresolved.length > 0) blockers.push('Label availability remains unresolved.');
  if (draft.metadata.errors.length > 0) blockers.push(...draft.metadata.errors);
  if (draft.assessment.errors.length > 0) blockers.push(...draft.assessment.errors);
  if (draft.scoring.errors.length > 0) blockers.push(...draft.scoring.errors);
  if (
    parsed.fallback['task-score'] !== undefined &&
    (input.metadata?.impact !== undefined || input.metadata?.workSize !== undefined) &&
    draft.scoring.score === null
  ) {
    blockers.push(
      'Changing a score input requires complete scoring evidence to recompute Task score.',
    );
  }
  if (mode === 'revise' && draft.status === 'needs_input') {
    blockers.push('Revision requires a complete actionable canonical task.');
  }
  if (mode === 'revise' && plan.changes.length > 0 && !input.revisionSummary?.trim()) {
    blockers.push('A material revision requires revisionSummary.');
  }
  const base = reportBase(mode, draft, current, plan, publication);

  if (blockers.length > 0) {
    return {
      ...base,
      status: 'blocked',
      mutatesGitHub: false,
      blockers,
      writes: [],
      verification: null,
    };
  }
  if (plan.changes.length === 0 && plan.comments.length === 0) {
    return {
      ...base,
      status: mode === 'normalize' && draft.status === 'needs_input' ? 'needs_input' : 'aligned',
      mutatesGitHub: false,
      blockers: [],
      writes: [],
      verification: verifyCreatedTask(plan, current),
    };
  }
  if (!publication.approved) {
    return {
      ...base,
      status: publication.findings.length > 0 ? 'publication_blocked' : 'approval_required',
      mutatesGitHub: false,
      blockers: [],
      writes: [],
      verification: null,
    };
  }

  const writes = [];
  if (plan.changes.length > 0) {
    const result = githubClient.updateIssue(draft.target, draft.target.issueNumber, plan.mutation);
    writes.push(
      result.ok
        ? { operation: 'update issue', status: 'succeeded' }
        : { operation: 'update issue', status: 'failed', error: result.error },
    );
    if (!result.ok) {
      return {
        ...base,
        status: 'failed',
        mutatesGitHub: false,
        blockers: [],
        writes,
        verification: null,
      };
    }
  }
  for (const comment of plan.comments) {
    const result = githubClient.addComment(draft.target, draft.target.issueNumber, comment.body);
    writes.push(
      result.ok
        ? { operation: `post ${comment.kind} comment`, status: 'succeeded' }
        : { operation: `post ${comment.kind} comment`, status: 'failed', error: result.error },
    );
  }

  const observed = readCurrent(githubClient, draft.target);
  const verification = observed.issue
    ? verifyCreatedTask(plan, observed)
    : { status: 'unavailable', checks: [], mismatches: [] };
  verification.errors = observed.errors;
  const complete =
    writes.every(({ status }) => status === 'succeeded') &&
    verification.status === 'verified' &&
    observed.errors.length === 0;
  return {
    ...base,
    status: complete ? 'updated' : 'partial',
    mutatesGitHub: true,
    blockers: [],
    writes,
    verification,
  };
}
