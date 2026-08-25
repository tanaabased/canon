import { createHash } from 'node:crypto';

const CLASSIFICATION_SIGNALS = new Set([
  'aggregate_outcome',
  'coverage_or_membership_required',
  'multiple_independently_completable_tasks',
  'timebox',
  'work_size',
]);

function nonemptyStrings(value) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function normalizeClassificationEvidence(value, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push('Milestone reframing requires structured classification evidence.');
    return [];
  }

  return value.map((entry, index) => {
    const signal = String(entry?.signal ?? '').trim();
    const evidence = String(entry?.evidence ?? '').trim();
    if (!CLASSIFICATION_SIGNALS.has(signal)) {
      errors.push(
        `Classification evidence ${index + 1} has unsupported signal: ${signal || '(missing)'}.`,
      );
    }
    if (!evidence) {
      errors.push(`Classification evidence ${index + 1} requires exact source evidence.`);
    }
    return { signal, evidence };
  });
}

function sourceTaskProvenance(evidence) {
  if (!evidence.issue) return null;
  return {
    target: `${evidence.target.slug}#${evidence.target.issueNumber}`,
    repository: evidence.target.slug,
    issueNumber: evidence.target.issueNumber,
    url: evidence.issue.url,
    title: evidence.issue.title,
    bodyDigest: `sha256:${createHash('sha256').update(evidence.issue.body).digest('hex')}`,
  };
}

/** Validate and normalize one read-only Project Milestone Author handoff. */
export default function validateMilestoneReframingHandoff(proposal = {}, evidence) {
  const errors = [];
  const recommendation = proposal.recommendation ?? {};
  const classificationEvidence = normalizeClassificationEvidence(
    recommendation.classificationEvidence,
    errors,
  );
  const classificationUncertainties = nonemptyStrings(recommendation.classificationUncertainties);

  if (!Array.isArray(recommendation.classificationUncertainties)) {
    errors.push('Milestone reframing must include a classificationUncertainties array.');
  }

  if (
    !classificationEvidence.some(
      ({ signal, evidence: source }) =>
        CLASSIFICATION_SIGNALS.has(signal) && signal !== 'work_size' && source,
    )
  ) {
    errors.push('Milestone reframing cannot be selected from Work size alone.');
  }
  if (classificationUncertainties.length > 0) {
    errors.push('Milestone-shaped classification remains unresolved.');
  }

  const rawHandoff = proposal.milestoneHandoff;
  if (!rawHandoff || typeof rawHandoff !== 'object' || Array.isArray(rawHandoff)) {
    errors.push('Milestone reframing requires one bounded milestoneHandoff.');
  }
  const rawMilestone = rawHandoff?.proposedMilestone ?? {};
  const proposedMilestone = {
    title: String(rawMilestone.title ?? '').trim(),
    outcome: String(rawMilestone.outcome ?? '').trim(),
    scope: nonemptyStrings(rawMilestone.scope),
    completionConditions: nonemptyStrings(rawMilestone.completionConditions),
    constraints: nonemptyStrings(rawMilestone.constraints),
    openQuestions: nonemptyStrings(rawMilestone.openQuestions),
  };

  if (!proposedMilestone.title) errors.push('The proposed milestone requires a title.');
  if (!proposedMilestone.outcome) errors.push('The proposed milestone requires an outcome.');
  if (proposedMilestone.scope.length === 0) {
    errors.push('The proposed milestone requires bounded scope.');
  }
  if (proposedMilestone.completionConditions.length === 0) {
    errors.push('The proposed milestone requires completion conditions.');
  }
  if (!Array.isArray(rawMilestone.constraints)) {
    errors.push('The proposed milestone must include a constraints array.');
  }
  if (!Array.isArray(rawMilestone.openQuestions)) {
    errors.push('The proposed milestone must include an openQuestions array.');
  }
  for (const constraint of evidence.constraints) {
    if (!proposedMilestone.constraints.includes(constraint)) {
      errors.push('The milestone handoff does not preserve every observed source-task constraint.');
      break;
    }
  }

  const sourceTask = sourceTaskProvenance(evidence);
  if (!sourceTask || !sourceTask.url || !sourceTask.title) {
    errors.push('Exact source-task provenance is unavailable.');
  }

  return {
    errors,
    handoff: {
      mutatesGitHub: false,
      sourceTask,
      classification: {
        evidence: classificationEvidence,
        uncertainties: classificationUncertainties,
      },
      proposedMilestone,
      sourceTaskDisposition: {
        status: 'decision_required',
        decision: null,
        sourceTaskUnchanged: true,
      },
      routing: {
        projectMilestoneAuthor: {
          skill: 'tanaab-project-milestone-author',
          repositoryTarget: evidence.target.slug,
          request: 'create_or_revise',
          requiresSeparateAuthorization: true,
        },
        projectMilestonePlanner: {
          skill: 'tanaab-project-milestone-planner',
          status: 'blocked_until_exact_milestone',
          exactMilestoneTarget: null,
        },
      },
    },
  };
}
