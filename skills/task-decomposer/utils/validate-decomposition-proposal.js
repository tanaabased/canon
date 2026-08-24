import evaluateDecompositionThreshold from './evaluate-decomposition-threshold.js';
import { normalizeTaskKind } from '../../task-author/utils/normalize-task-kind.js';
import { renderTaskBody } from '../../task-author/utils/render-task-body.js';
import extractTaskConstraints from './extract-task-constraints.js';

const CHILD_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DECISIONS = new Set(['keep_intact', 'decompose']);

function nonemptyStrings(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function findCycle(keys, dependencies) {
  const adjacency = new Map(keys.map((key) => [key, []]));
  for (const { blocked, blockedBy } of dependencies) adjacency.get(blocked)?.push(blockedBy);
  const visiting = new Set();
  const visited = new Set();

  function walk(key, path) {
    if (visiting.has(key)) return [...path, key];
    if (visited.has(key)) return null;
    visiting.add(key);
    for (const next of adjacency.get(key) ?? []) {
      const cycle = walk(next, [...path, key]);
      if (cycle) return cycle;
    }
    visiting.delete(key);
    visited.add(key);
    return null;
  }

  for (const key of keys) {
    const cycle = walk(key, []);
    if (cycle) return cycle;
  }
  return null;
}

function taskRetainsConstraint(task, constraint) {
  try {
    const kind = normalizeTaskKind(task?.kind);
    if (!kind) return false;
    return extractTaskConstraints(renderTaskBody(kind, task.sections).body).some((section) =>
      section.includes(constraint),
    );
  } catch {
    return false;
  }
}

/** Validate semantic coverage, independence, shallowness, and graph invariants. */
export default function validateDecompositionProposal(proposal = {}, evidence) {
  const errors = [];
  const warnings = [];
  const findings = { gaps: [], overlaps: [], duplicateCriteria: [] };
  const recommendation = proposal.recommendation ?? {};
  const decision = recommendation.decision;
  const rationale = nonemptyStrings(recommendation.rationale);
  const threshold = evaluateDecompositionThreshold(evidence.metadata.workSize.value);

  if (!DECISIONS.has(decision)) {
    errors.push('Recommendation decision must be keep_intact or decompose.');
  }
  if (rationale.length === 0) errors.push('Recommendation requires evidence-based rationale.');
  if (threshold.explicitReviewRequired && recommendation.explicitReviewAcknowledged !== true) {
    errors.push(`Work size ${threshold.workSize} requires an explicit decomposition review.`);
  }
  if (threshold.suggestedDecision && threshold.suggestedDecision !== decision) {
    warnings.push(
      `The ${decision} decision overrides the Work size ${threshold.workSize} guidance; preserve the rationale.`,
    );
  }

  const children = Array.isArray(proposal.children) ? proposal.children : [];
  const dependencies = Array.isArray(proposal.dependencies) ? proposal.dependencies : [];
  if (decision === 'keep_intact') {
    if (children.length > 0 || dependencies.length > 0 || proposal.parentRevision) {
      errors.push(
        'A keep_intact recommendation cannot contain child, relationship, or parent writes.',
      );
    }
    return { decision, errors, findings, threshold, warnings };
  }

  if (evidence.parent) {
    errors.push(
      'The proposed parent is already a sub-issue; decomposing it would create depth two.',
    );
  }
  const nested = evidence.nestedSubIssues.filter(({ subIssues }) => subIssues.length > 0);
  if (nested.length > 0) {
    errors.push(
      `Existing child tasks already contain nested work: ${nested.map(({ issue }) => `#${issue.number}`).join(', ')}.`,
    );
  }
  if (children.length < 2) errors.push('A decomposition requires at least two child tasks.');
  if (!proposal.parentRevision) errors.push('A decomposition requires one parent rollup revision.');

  const keys = [];
  const keySet = new Set();
  const criterionOwners = new Map();
  const childCriteria = new Map();
  const parentCriteria = evidence.acceptanceCriteria.map(({ text }) => text);
  if (parentCriteria.length === 0) {
    errors.push('The parent has no observable acceptance criteria to cover.');
  }

  for (const [index, child] of children.entries()) {
    const key = String(child.key ?? '').trim();
    if (!CHILD_KEY.test(key)) errors.push(`Child ${index + 1} requires a kebab-case key.`);
    if (keySet.has(key)) errors.push(`Duplicate child key: ${key}.`);
    keySet.add(key);
    keys.push(key);

    if (!child.task || typeof child.task !== 'object') {
      errors.push(`Child ${key || index + 1} requires one canonical Task Author input.`);
      continue;
    }
    if (
      child.reuseIssueNumber !== undefined &&
      (!Number.isInteger(Number(child.reuseIssueNumber)) || Number(child.reuseIssueNumber) <= 0)
    ) {
      errors.push(`Child ${key} reuseIssueNumber must be a positive issue number.`);
    }
    if (Object.keys(child.task.relationships ?? {}).length > 0) {
      errors.push(`Child ${key} relationships must be declared in the decomposition graph.`);
    }
    if ((child.task.assignees?.length ?? 0) > 0 || child.task.milestone !== undefined) {
      errors.push(`Child ${key} cannot bundle assignee or milestone writes.`);
    }
    const acceptanceCriteria = nonemptyStrings(child.task.sections?.acceptanceCriteria);
    if (acceptanceCriteria.length === 0) {
      errors.push(`Child ${key} requires checkable acceptance criteria.`);
    }
    if (!/pull request/i.test(String(child.task.sections?.delivery ?? ''))) {
      errors.push(`Child ${key} delivery evidence must name its completion pull request.`);
    }
    const duplicateWithinChild = acceptanceCriteria.filter(
      (criterion, criterionIndex) => acceptanceCriteria.indexOf(criterion) !== criterionIndex,
    );
    for (const criterion of duplicateWithinChild) {
      findings.duplicateCriteria.push({ child: key, criterion });
    }
    childCriteria.set(key, acceptanceCriteria);

    if (nonemptyStrings(child.sourceEvidence).length === 0) {
      errors.push(`Child ${key} requires supported source evidence.`);
    }
    const covers = nonemptyStrings(child.covers);
    for (const criterion of covers) {
      if (!parentCriteria.includes(criterion)) {
        errors.push(
          `Child ${key} covers an acceptance criterion not present on the parent: ${criterion}`,
        );
        continue;
      }
      if (!criterionOwners.has(criterion)) criterionOwners.set(criterion, []);
      criterionOwners.get(criterion).push(key);
    }
  }

  for (const criterion of parentCriteria) {
    const owners = criterionOwners.get(criterion) ?? [];
    if (owners.length === 0) findings.gaps.push(criterion);
    if (owners.length > 1) findings.overlaps.push({ criterion, children: owners });
  }
  if (findings.gaps.length > 0) {
    errors.push(`Parent acceptance coverage has ${findings.gaps.length} gap(s).`);
  }
  if (findings.overlaps.length > 0) {
    errors.push(`Parent acceptance coverage has ${findings.overlaps.length} overlap(s).`);
  }
  if (findings.duplicateCriteria.length > 0) {
    errors.push('Child acceptance criteria contain exact duplicates.');
  }

  const seenAcceptance = new Map();
  for (const [key, criteria] of childCriteria) {
    for (const criterion of criteria) {
      const normalized = criterion.toLowerCase();
      const owner = seenAcceptance.get(normalized);
      if (owner && owner !== key) {
        findings.duplicateCriteria.push({ children: [owner, key], criterion });
      } else seenAcceptance.set(normalized, key);
    }
  }
  if (findings.duplicateCriteria.some(({ children: owners }) => owners)) {
    errors.push('Child tasks contain overlapping exact acceptance criteria.');
  }

  const proposalConstraints = nonemptyStrings(proposal.sharedConstraints);
  for (const constraint of evidence.constraints) {
    if (!proposalConstraints.includes(constraint)) {
      errors.push('The proposal does not preserve every observed parent constraint.');
      break;
    }
  }
  for (const child of children) {
    const missing = proposalConstraints.filter(
      (constraint) => !taskRetainsConstraint(child.task, constraint),
    );
    if (missing.length > 0) {
      errors.push(`Child ${child.key} does not render every shared constraint.`);
    }
  }

  const edges = new Set();
  for (const [index, dependency] of dependencies.entries()) {
    const blocked = String(dependency.blocked ?? '').trim();
    const blockedBy = String(dependency.blockedBy ?? '').trim();
    if (!keySet.has(blocked) || !keySet.has(blockedBy)) {
      errors.push(`Dependency ${index + 1} must reference two proposed child keys.`);
      continue;
    }
    if (blocked === blockedBy) errors.push(`Dependency ${index + 1} is a self-link.`);
    const edge = `${blocked}<-${blockedBy}`;
    if (edges.has(edge)) errors.push(`Duplicate dependency: ${edge}.`);
    edges.add(edge);
    if (!String(dependency.reason ?? '').trim()) {
      errors.push(`Dependency ${edge} requires evidence that it is necessary ordering.`);
    }
  }
  const cycle = findCycle(keys, dependencies);
  if (cycle) errors.push(`Dependency cycle detected: ${cycle.join(' -> ')}.`);

  const declaredGaps = nonemptyStrings(proposal.analysis?.gaps);
  const declaredOverlaps = nonemptyStrings(proposal.analysis?.overlaps);
  const declaredDuplicates = nonemptyStrings(proposal.analysis?.duplicates);
  if (declaredGaps.length > 0 || declaredOverlaps.length > 0 || declaredDuplicates.length > 0) {
    errors.push('The semantic analysis still reports gaps, overlaps, or duplicate work.');
  }

  return { decision, errors, findings, threshold, warnings };
}
