import { GitHubTaskClient } from './github-task-client.js';
import { authorTaskDraft } from './task-draft-author.js';
import { readTaskState } from './task-state-reader.js';
import planDigest from '../../../utils/plan-digest.js';
import { buildTaskCreatePlan } from '../utils/build-task-create-plan.js';
import { evaluateTaskPublication } from '../utils/evaluate-task-publication.js';
import { verifyCreatedTask } from '../utils/verify-created-task.js';

function blockedDraft(draft, input, planErrors) {
  const reasons = [...planErrors];
  if (draft.status === 'needs_input') reasons.push('The task draft still requires input.');
  if (draft.metadata.unresolved.length > 0) {
    reasons.push('Native-versus-fallback metadata placement remains unresolved.');
  }
  if (draft.labels.unresolved.length > 0) {
    reasons.push('Requested label availability remains unresolved.');
  }
  if (draft.target.issueNumber !== null) {
    reasons.push('Create mode requires a repository target without an issue number.');
  }
  if (Object.keys(draft.relationships).length > 0) {
    reasons.push('Relationship writes are not supported by the current create mode.');
  }
  if ((input.assignees?.length ?? 0) > 0 || input.milestone !== undefined) {
    reasons.push('Assignee and milestone writes are not supported by the current create mode.');
  }
  return reasons;
}

function baseReport(draft, plan, publication) {
  return {
    mode: 'create',
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
    warnings: [...draft.warnings],
  };
}

/** Create one approved task, then re-read and verify every Task Author-managed value. */
export function createTask(input = {}, { githubClient = new GitHubTaskClient() } = {}) {
  const draft = authorTaskDraft(input, { githubClient });
  const { errors: planErrors, plan } = buildTaskCreatePlan(draft);
  const digest = planDigest(plan);
  const publication = evaluateTaskPublication(plan, digest, input.publication);
  const blockers = blockedDraft(draft, input, planErrors);
  const report = baseReport(draft, plan, publication);

  if (blockers.length > 0) {
    return {
      ...report,
      status: 'blocked',
      mutatesGitHub: false,
      blockers,
      issue: null,
      writes: [],
      verification: null,
      operations: [...draft.operations],
    };
  }

  if (!publication.approved) {
    return {
      ...report,
      status: publication.findings.length > 0 ? 'publication_blocked' : 'approval_required',
      mutatesGitHub: false,
      blockers: [],
      issue: null,
      writes: [],
      verification: null,
      operations: [...draft.operations],
    };
  }

  const writes = [];
  const creation = githubClient.createIssue(draft.target, plan.issue);
  if (!creation.ok) {
    return {
      ...report,
      status: 'failed',
      mutatesGitHub: false,
      blockers: [],
      issue: null,
      writes: [{ operation: 'create issue', status: 'failed', error: creation.error }],
      verification: null,
      operations: [...draft.operations, 'create issue'],
    };
  }

  const issue = {
    number: creation.value.number ?? null,
    url: creation.value.html_url ?? null,
  };
  writes.push({ operation: 'create issue', status: 'succeeded' });

  if (!issue.number) {
    return {
      ...report,
      status: 'partial',
      mutatesGitHub: true,
      blockers: [],
      issue,
      writes,
      verification: {
        status: 'unavailable',
        checks: [],
        mismatches: [],
        errors: [
          'GitHub created an issue but did not return its number; verification cannot continue.',
        ],
      },
      operations: [...draft.operations, 'create issue'],
    };
  }

  for (const comment of plan.comments) {
    const result = githubClient.addComment(draft.target, issue.number, comment.body);
    writes.push(
      result.ok
        ? { operation: `post ${comment.kind} comment`, status: 'succeeded' }
        : { operation: `post ${comment.kind} comment`, status: 'failed', error: result.error },
    );
  }

  const observed = readTaskState(githubClient, draft.target, {
    comments: plan.comments.length > 0,
    fields: plan.expected.fields.length > 0,
    issueNumber: issue.number,
  });
  const verification = observed.issue
    ? verifyCreatedTask(plan, observed)
    : { status: 'unavailable', checks: [], mismatches: [] };
  verification.errors = observed.errors;
  const failedWrites = writes.some(({ status }) => status === 'failed');
  const complete =
    !failedWrites && verification.status === 'verified' && observed.errors.length === 0;

  return {
    ...report,
    status: complete ? 'created' : 'partial',
    mutatesGitHub: true,
    blockers: [],
    issue,
    writes,
    verification,
    operations: [
      ...draft.operations,
      'create issue',
      ...plan.comments.map(({ kind }) => `post ${kind} comment`),
      're-read issue',
      ...(plan.expected.fields.length > 0 ? ['re-read issue fields'] : []),
      ...(plan.comments.length > 0 ? ['re-read comments'] : []),
    ],
  };
}
