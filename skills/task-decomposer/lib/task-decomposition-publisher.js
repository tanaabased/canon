import { resolveParentRollup } from '../utils/render-parent-rollup.js';
import verifyReusableChild from '../utils/verify-reusable-child.js';
import { prepareTaskDecomposition } from './task-decomposition-planner.js';

function failedResult(prepared, writes, failedOperation, error, verification = null) {
  const index = prepared.plan.operationOrder.findIndex(({ id }) => id === failedOperation);
  return {
    ...prepared,
    status: writes.some(({ status }) => status === 'succeeded') ? 'partial' : 'failed',
    mutatesGitHub: writes.some(({ status }) => status === 'succeeded'),
    writes: [...writes, { operation: failedOperation, status: 'failed', error }],
    completedOperations: writes
      .filter(({ status }) => status === 'succeeded')
      .map(({ operation }) => operation),
    remainingOperations: prepared.plan.operationOrder.slice(index).map(({ id }) => id),
    verification,
  };
}

function verifyPublishedDecomposition(prepared, client, references, resolvedParentBody) {
  const checks = [];
  const errors = [];
  const { target } = prepared.evidence;
  const check = (key, expected, actual) => {
    checks.push({
      key,
      expected,
      actual,
      status: JSON.stringify(expected) === JSON.stringify(actual) ? 'verified' : 'drifted',
    });
  };

  for (const child of prepared.plan.children) {
    const reference = references[child.key];
    const issue = client.readIssue(target, reference.number);
    const fields =
      child.taskPlan.expected.fields.length > 0
        ? client.readIssueFieldValues(target, reference.number)
        : { ok: true, value: [] };
    const comments =
      child.taskPlan.comments.length > 0
        ? client.readComments(target, reference.number)
        : { ok: true, value: [] };
    for (const result of [issue, fields, comments]) if (!result.ok) errors.push(result.error);
    if (issue.ok) {
      const verified = verifyReusableChild(child.taskPlan, {
        issue: issue.value,
        fields: fields.ok ? fields.value : [],
        comments: comments.ok ? comments.value : [],
      });
      check(`child:${child.key}`, 'reusable', verified.status);
      if (verified.missingComments.length > 0) {
        errors.push(`Child ${child.key} is missing managed comments after publication.`);
      }
    }
    const nested = client.listSubIssues(target, reference.number);
    if (!nested.ok) errors.push(nested.error);
    else check(`child-depth:${child.key}`, 0, nested.value.length);
    const parent = client.readParent(target, reference.number);
    if (!parent.ok) errors.push(parent.error);
    else check(`parent:${child.key}`, target.issueNumber, Number(parent.value.number));
  }

  const parent = client.readIssue(target, target.issueNumber);
  if (!parent.ok) errors.push(parent.error);
  else {
    check('parent-title', prepared.plan.parentRevision.expected.title, parent.value.title);
    check('parent-body', resolvedParentBody, parent.value.body);
  }
  const parentComments = prepared.plan.parentRevision.comment
    ? client.readComments(target, target.issueNumber)
    : { ok: true, value: [] };
  if (!parentComments.ok) errors.push(parentComments.error);
  else if (prepared.plan.parentRevision.comment) {
    check(
      'parent-comment',
      true,
      parentComments.value.some(({ body }) => body === prepared.plan.parentRevision.comment.body),
    );
  }
  const subIssues = client.listSubIssues(target, target.issueNumber);
  if (!subIssues.ok) errors.push(subIssues.error);
  else {
    const observedIds = new Set(subIssues.value.map(({ id }) => Number(id)));
    for (const [key, reference] of Object.entries(references)) {
      check(`sub-issue:${key}`, true, observedIds.has(reference.id));
    }
  }
  for (const dependency of prepared.plan.relationships.dependencies) {
    const observed = client.listBlockedBy(target, references[dependency.blocked].number);
    if (!observed.ok) errors.push(observed.error);
    else {
      check(
        `dependency:${dependency.blocked}<-${dependency.blockedBy}`,
        true,
        observed.value.some(({ id }) => Number(id) === references[dependency.blockedBy].id),
      );
    }
  }

  return {
    status:
      errors.length === 0 && checks.every(({ status }) => status === 'verified')
        ? 'verified'
        : 'drifted',
    checks,
    errors,
    mismatches: checks.filter(({ status }) => status !== 'verified'),
  };
}

/** Apply one fresh digest-approved plan in a resumable, no-rollback order. */
export function publishTaskDecomposition(input = {}, { client } = {}) {
  const prepared = prepareTaskDecomposition(input, { client });
  if (prepared.status !== 'approved') {
    return {
      ...prepared,
      writes: [],
      completedOperations: [],
      remainingOperations: [],
      verification: null,
    };
  }

  const writes = [];
  const references = Object.fromEntries(
    prepared.plan.children.filter(({ issue }) => issue).map(({ key, issue }) => [key, issue]),
  );
  const succeed = (operation) => writes.push({ operation, status: 'succeeded' });

  for (const child of prepared.plan.children) {
    if (child.action === 'create') {
      const operation = `create:${child.key}`;
      const result = client.createIssue(prepared.evidence.target, child.taskPlan.issue);
      if (!result.ok) return failedResult(prepared, writes, operation, result.error);
      const reference = {
        id: Number(result.value.id),
        number: Number(result.value.number),
        url: result.value.html_url || result.value.url,
      };
      if (!reference.id || !reference.number || !reference.url) {
        return failedResult(
          prepared,
          writes,
          operation,
          'GitHub created the issue without returning its id, number, and URL.',
        );
      }
      references[child.key] = reference;
      succeed(operation);
    }

    const comments = child.action === 'create' ? child.taskPlan.comments : child.missingComments;
    for (const comment of comments) {
      const operation = `comment:${child.key}:${comment.kind}`;
      const result = client.addComment(
        prepared.evidence.target,
        references[child.key].number,
        comment.body,
      );
      if (!result.ok) return failedResult(prepared, writes, operation, result.error);
      succeed(operation);
    }
  }

  for (const relationship of prepared.plan.relationships.subIssues) {
    if (relationship.action === 'existing') continue;
    const operation = `sub-issue:${relationship.child}`;
    const result = client.addSubIssue(
      prepared.evidence.target,
      prepared.evidence.target.issueNumber,
      references[relationship.child].id,
    );
    if (!result.ok) return failedResult(prepared, writes, operation, result.error);
    succeed(operation);
  }

  for (const dependency of prepared.plan.relationships.dependencies) {
    if (dependency.action === 'existing') continue;
    const operation = `dependency:${dependency.blocked}<-${dependency.blockedBy}`;
    const result = client.addBlockedBy(
      prepared.evidence.target,
      references[dependency.blocked].number,
      references[dependency.blockedBy].id,
    );
    if (!result.ok) return failedResult(prepared, writes, operation, result.error);
    succeed(operation);
  }

  const resolvedParentBody = resolveParentRollup(
    prepared.plan.parentRevision.expected.bodyTemplate,
    references,
  );
  if (Object.keys(prepared.plan.parentRevision.mutationTemplate).length > 0) {
    const operation = 'update:parent';
    const mutation = {
      ...prepared.plan.parentRevision.mutationTemplate,
      ...(prepared.plan.parentRevision.mutationTemplate.body ? { body: resolvedParentBody } : {}),
    };
    const result = client.updateIssue(
      prepared.evidence.target,
      prepared.evidence.target.issueNumber,
      mutation,
    );
    if (!result.ok) return failedResult(prepared, writes, operation, result.error);
    succeed(operation);
  }
  if (prepared.plan.parentRevision.comment) {
    const operation = 'comment:parent:decomposition-summary';
    const result = client.addComment(
      prepared.evidence.target,
      prepared.evidence.target.issueNumber,
      prepared.plan.parentRevision.comment.body,
    );
    if (!result.ok) return failedResult(prepared, writes, operation, result.error);
    succeed(operation);
  }

  const verification = verifyPublishedDecomposition(
    prepared,
    client,
    references,
    resolvedParentBody,
  );
  const verifyOperation = 'verify:decomposition';
  if (verification.status !== 'verified') {
    return failedResult(
      prepared,
      writes,
      verifyOperation,
      `Exact read-back verification drifted: ${verification.errors.join('; ') || 'managed values differ'}`,
      verification,
    );
  }
  succeed(verifyOperation);

  return {
    ...prepared,
    status: writes.length === 1 ? 'aligned' : 'published',
    mutatesGitHub: writes.some(({ operation }) => operation !== verifyOperation),
    writes,
    completedOperations: writes.map(({ operation }) => operation),
    remainingOperations: [],
    references,
    verification,
  };
}
