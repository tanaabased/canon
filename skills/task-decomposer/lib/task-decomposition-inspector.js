import { normalizeTaskTarget } from '../../task-author/utils/normalize-task-target.js';
import buildTaskDecompositionEvidence from '../utils/build-task-decomposition-evidence.js';

function unresolvedEvidence(target, error) {
  return {
    ...buildTaskDecompositionEvidence({ target }),
    errors: [error instanceof Error ? error.message : String(error)],
    status: 'unresolved',
    warnings: [],
  };
}

/** Collect parent, relationship, and bounded recent repository-candidate evidence. */
export function inspectTaskDecompositionEvidence(rawTarget, client) {
  const target = normalizeTaskTarget(rawTarget);
  if (!target.issueNumber) {
    throw new Error('Task decomposition requires an explicit OWNER/REPO#NUMBER target.');
  }

  const warnings = [];
  try {
    warnings.push(...client.ensureAvailable());
  } catch (error) {
    return unresolvedEvidence(target, error);
  }

  let repository = null;
  try {
    repository = client.inspectRepository(target);
    warnings.push(...(repository.warnings ?? []));
  } catch (error) {
    warnings.push(
      `repository capabilities: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const errors = [];
  const observed = {};
  const reads = [
    ['issue', () => client.readIssue(target, target.issueNumber)],
    ['fields', () => client.readIssueFieldValues(target, target.issueNumber)],
    ['comments', () => client.readComments(target, target.issueNumber)],
    ['timeline', () => client.readTimeline(target, target.issueNumber)],
    ['parent', () => client.readParent(target, target.issueNumber), true],
    ['subIssues', () => client.listSubIssues(target, target.issueNumber)],
    ['blockedBy', () => client.listBlockedBy(target, target.issueNumber)],
    ['blocking', () => client.listBlocking(target, target.issueNumber)],
    ['repositoryIssues', () => client.listRepositoryIssues(target)],
  ];

  for (const [label, read, notFoundIsEmpty = false] of reads) {
    const result = read();
    if (result.ok) observed[label] = result.value;
    else if (notFoundIsEmpty && /404|not found/i.test(result.error)) observed[label] = null;
    else errors.push(`${label}: ${result.error}`);
  }

  const nestedSubIssues = [];
  for (const child of observed.subIssues ?? []) {
    const result = client.listSubIssues(target, child.number);
    if (result.ok) nestedSubIssues.push({ issue: child, subIssues: result.value });
    else errors.push(`sub-issues for #${child.number}: ${result.error}`);
  }

  const evidence = buildTaskDecompositionEvidence({
    target,
    repository,
    nestedSubIssues,
    ...observed,
  });
  return {
    ...evidence,
    errors,
    status: evidence.issue ? (errors.length === 0 ? 'ready' : 'partial') : 'unresolved',
    warnings,
  };
}
