import evaluatePublication from '../../../utils/evaluate-publication.js';
import planDigest from '../../../utils/plan-digest.js';
import { authorTaskDraft } from '../../task-author/lib/task-draft-author.js';
import { readTaskState } from '../../task-author/lib/task-state-reader.js';
import { buildTaskCreatePlan } from '../../task-author/utils/build-task-create-plan.js';
import buildParentRevisionPlan from '../utils/build-parent-revision-plan.js';
import validateDecompositionProposal from '../utils/validate-decomposition-proposal.js';
import verifyReusableChild from '../utils/verify-reusable-child.js';
import { inspectTaskDecompositionEvidence } from './task-decomposition-inspector.js';

function parentRead(client, target, issueNumber) {
  const result = client.readParent(target, issueNumber);
  if (result.ok) return { error: null, value: result.value };
  if (/404|not found/i.test(result.error)) return { error: null, value: null };
  return { error: result.error, value: null };
}

function publicTexts(plan) {
  return [
    ...plan.children.flatMap(({ taskPlan }) => [
      taskPlan.issue.title,
      taskPlan.issue.body,
      ...taskPlan.comments.map(({ body }) => body),
    ]),
    plan.parentRevision.expected.title,
    plan.parentRevision.expected.bodyTemplate,
    plan.parentRevision.comment?.body ?? '',
  ];
}

function operationOrder(children, subIssues, dependencies, parentRevision) {
  const operations = [];
  for (const child of children) {
    if (child.action === 'create') {
      operations.push({ id: `create:${child.key}`, type: 'create-child', child: child.key });
      for (const comment of child.taskPlan.comments) {
        operations.push({
          id: `comment:${child.key}:${comment.kind}`,
          type: 'comment-child',
          child: child.key,
          kind: comment.kind,
        });
      }
    } else {
      for (const comment of child.missingComments) {
        operations.push({
          id: `comment:${child.key}:${comment.kind}`,
          type: 'comment-child',
          child: child.key,
          kind: comment.kind,
        });
      }
    }
  }
  for (const relationship of subIssues.filter(({ action }) => action === 'add')) {
    operations.push({
      id: `sub-issue:${relationship.child}`,
      type: 'add-sub-issue',
      child: relationship.child,
    });
  }
  for (const dependency of dependencies.filter(({ action }) => action === 'add')) {
    operations.push({
      id: `dependency:${dependency.blocked}<-${dependency.blockedBy}`,
      type: 'add-dependency',
      blocked: dependency.blocked,
      blockedBy: dependency.blockedBy,
    });
  }
  if (Object.keys(parentRevision.mutationTemplate).length > 0) {
    operations.push({ id: 'update:parent', type: 'update-parent' });
  }
  if (parentRevision.comment) {
    operations.push({ id: 'comment:parent:decomposition-summary', type: 'comment-parent' });
  }
  operations.push({ id: 'verify:decomposition', type: 'verify' });
  return operations;
}

function buildChildPlan(child, proposal, evidence, client) {
  const blocked = proposal.dependencies.some(({ blocked: key }) => key === child.key);
  const draft = authorTaskDraft(
    {
      ...child.task,
      target: evidence.target.slug,
      relationships: { ...child.task.relationships, ...(blocked ? { blockedBy: true } : {}) },
    },
    { githubClient: client },
  );
  const { errors, plan } = buildTaskCreatePlan(draft);
  const blockers = [
    ...errors,
    ...draft.metadata.errors,
    ...draft.assessment.errors,
    ...draft.scoring.errors,
  ];
  if (draft.status === 'needs_input')
    blockers.push(`Child ${child.key} is not a complete canonical task.`);
  if (draft.metadata.unresolved.length > 0) {
    blockers.push(`Child ${child.key} has unresolved native-versus-fallback metadata.`);
  }
  if (draft.labels.unresolved.length > 0) {
    blockers.push(`Child ${child.key} has unresolved label availability.`);
  }
  return { blockers, draft, plan };
}

function resolveExistingChild(child, taskPlan, evidence, client) {
  const explicitNumber = Number(child.reuseIssueNumber) || null;
  const errors = [];
  const observedCandidates = new Map();
  const addCandidate = (candidate) => {
    if (candidate && !candidate.pull_request) {
      observedCandidates.set(Number(candidate.number), candidate);
    }
  };

  for (const candidate of evidence.repositoryTasks.filter(
    ({ title }) => title === taskPlan.issue.title,
  )) {
    const exact = client.readIssue(evidence.target, candidate.number);
    if (!exact.ok) {
      errors.push(`Recent child candidate #${candidate.number} could not be read: ${exact.error}`);
    } else addCandidate(exact.value);
  }

  if (explicitNumber && !observedCandidates.has(explicitNumber)) {
    const explicit = client.readIssue(evidence.target, explicitNumber);
    if (!explicit.ok) {
      errors.push(
        `Requested reusable child #${explicitNumber} could not be read: ${explicit.error}`,
      );
    } else addCandidate(explicit.value);
  }

  if (!explicitNumber) {
    const search = client.searchIssuesByTitle(evidence.target, taskPlan.issue.title);
    if (!search.ok) {
      errors.push(`Exact-title child search failed for ${child.key}: ${search.error}`);
    } else {
      for (const candidate of search.value) addCandidate(candidate);
    }
  }

  const candidates = [
    ...new Map(
      [...observedCandidates.values()]
        .filter(({ number }) => Number(number) !== evidence.target.issueNumber)
        .map((candidate) => [Number(candidate.number), candidate]),
    ).values(),
  ];
  const selected = explicitNumber
    ? candidates.filter(({ number }) => Number(number) === explicitNumber)
    : candidates.filter(
        ({ title, body }) => title === taskPlan.issue.title && body === taskPlan.issue.body,
      );
  const titleCollisions = candidates.filter(
    ({ title, body }) => title === taskPlan.issue.title && body !== taskPlan.issue.body,
  );
  if (titleCollisions.length > 0 && !explicitNumber) {
    errors.push(
      `Child ${child.key} collides with existing non-exact task(s): ${titleCollisions.map(({ number }) => `#${number}`).join(', ')}.`,
    );
  }
  if (explicitNumber && selected.length === 0) {
    errors.push(
      `Requested reusable child #${explicitNumber} was not observed in the target repository.`,
    );
  }
  if (selected.length > 1) {
    errors.push(`Child ${child.key} has multiple exact reusable matches.`);
  }
  if (errors.length > 0 || selected.length === 0) {
    return { action: 'create', errors, issue: null, missingComments: [], blockedBy: [] };
  }

  const candidate = selected[0];
  if (candidate.title !== taskPlan.issue.title || candidate.body !== taskPlan.issue.body) {
    return {
      action: 'create',
      errors: [`Reusable child #${candidate.number} is not an exact semantic match.`],
      issue: null,
      missingComments: [],
      blockedBy: [],
    };
  }
  const current = readTaskState(client, evidence.target, {
    issueNumber: candidate.number,
    fields: taskPlan.expected.fields.length > 0,
    comments: taskPlan.comments.length > 0,
  });
  errors.push(...current.errors.map((error) => `Reusable child #${candidate.number}: ${error}`));
  const verification = current.issue
    ? verifyReusableChild(taskPlan, current)
    : { errors: ['issue read failed.'], missingComments: [] };
  errors.push(
    ...verification.errors.map((error) => `Reusable child #${candidate.number}: ${error}`),
  );

  const parent = parentRead(client, evidence.target, candidate.number);
  if (parent.error) errors.push(`Reusable child #${candidate.number} parent: ${parent.error}`);
  if (parent.value && Number(parent.value.number) !== evidence.target.issueNumber) {
    errors.push(
      `Reusable child #${candidate.number} already belongs to parent #${parent.value.number}.`,
    );
  }
  const nested = client.listSubIssues(evidence.target, candidate.number);
  if (!nested.ok) errors.push(`Reusable child #${candidate.number} sub-issues: ${nested.error}`);
  else if (nested.value.length > 0) {
    errors.push(`Reusable child #${candidate.number} has nested sub-issues.`);
  }
  const blockedBy = client.listBlockedBy(evidence.target, candidate.number);
  if (!blockedBy.ok)
    errors.push(`Reusable child #${candidate.number} dependencies: ${blockedBy.error}`);

  return {
    action: 'reuse',
    errors,
    issue: current.issue
      ? {
          id: Number(current.issue.id),
          number: Number(current.issue.number),
          url: current.issue.html_url || current.issue.url,
        }
      : null,
    missingComments: verification.missingComments,
    blockedBy: blockedBy.ok ? blockedBy.value : [],
  };
}

/** Inspect current state and build one complete, digestable decomposition plan. */
export function prepareTaskDecomposition(input = {}, { client } = {}) {
  const evidence = inspectTaskDecompositionEvidence(input.target, client);
  const validation = validateDecompositionProposal(input, evidence);
  const blockers = [...evidence.errors, ...validation.errors];
  const base = {
    mode: 'decompose',
    target: evidence.target,
    evidence,
    recommendation: {
      ...input.recommendation,
      threshold: validation.threshold,
    },
    validation,
    warnings: [...evidence.warnings, ...validation.warnings],
  };

  if (validation.decision === 'keep_intact') {
    return {
      ...base,
      status: blockers.length > 0 ? 'blocked' : 'keep_intact',
      mutatesGitHub: false,
      blockers,
      plan: null,
      publication: null,
    };
  }
  if (evidence.status !== 'ready')
    blockers.push('Complete parent evidence is required before publication.');

  const children = [];
  const existingBlockedByIds = new Map();
  if (blockers.length === 0) {
    for (const child of input.children) {
      const built = buildChildPlan(child, input, evidence, client);
      blockers.push(...built.blockers);
      const existing = resolveExistingChild(child, built.plan, evidence, client);
      blockers.push(...existing.errors);
      existingBlockedByIds.set(child.key, new Set(existing.blockedBy.map(({ id }) => Number(id))));
      children.push({
        key: child.key,
        task: child.task,
        covers: child.covers,
        sourceEvidence: child.sourceEvidence,
        taskPlan: built.plan,
        action: existing.action,
        issue: existing.issue,
        missingComments: existing.missingComments,
      });
    }
  }

  if (blockers.length > 0) {
    return {
      ...base,
      status: 'blocked',
      mutatesGitHub: false,
      blockers,
      plan: null,
      publication: null,
    };
  }

  const subIssues = children.map((child) => ({
    parent: evidence.target.issueNumber,
    child: child.key,
    action:
      child.issue && evidence.subIssues.some(({ number }) => number === child.issue.number)
        ? 'existing'
        : 'add',
  }));
  const byKey = new Map(children.map((child) => [child.key, child]));
  const dependencies = input.dependencies.map((dependency) => {
    const blocked = byKey.get(dependency.blocked);
    const blockedBy = byKey.get(dependency.blockedBy);
    const existing =
      blocked.issue &&
      blockedBy.issue &&
      existingBlockedByIds.get(blocked.key)?.has(blockedBy.issue.id);
    return { ...dependency, action: existing ? 'existing' : 'add' };
  });
  const parent = buildParentRevisionPlan(evidence, input, children);
  if (parent.errors.length > 0) {
    return {
      ...base,
      status: 'blocked',
      mutatesGitHub: false,
      blockers: parent.errors,
      plan: null,
      publication: null,
    };
  }

  const plan = {
    contract: 'tanaab/task-decomposition/v1',
    target: `${evidence.target.slug}#${evidence.target.issueNumber}`,
    recommendation: base.recommendation,
    analysis: input.analysis ?? { gaps: [], overlaps: [], duplicates: [] },
    sharedConstraints: input.sharedConstraints ?? [],
    children,
    relationships: { subIssues, dependencies },
    parentRevision: parent.plan,
  };
  plan.operationOrder = operationOrder(children, subIssues, dependencies, parent.plan);
  const digest = planDigest(plan);
  const publication = evaluatePublication({
    digest,
    publication: input.publication,
    target: plan.target,
    texts: publicTexts(plan),
  });
  return {
    ...base,
    status: publication.approved
      ? 'approved'
      : publication.findings.length > 0
        ? 'publication_blocked'
        : 'approval_required',
    mutatesGitHub: false,
    blockers: [],
    plan,
    publication,
  };
}
