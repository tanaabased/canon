import { CANONICAL_LABELS } from '../lib/task-author-contract.js';

/** Classify canonical label intent separately from repository availability. */
export function classifyTaskLabels({
  kind = null,
  metadata = {},
  signals = {},
  actionable = false,
  hasAcceptanceCriteria = false,
  reproductionAvailable = null,
  availableLabels = null,
  relationships = {},
} = {}) {
  const desired = [];
  const warnings = [];
  const add = (label) => {
    if (!desired.includes(label)) desired.push(label);
  };

  if (signals.documentation === true) add('documentation');
  if (signals.breakingChange === true) add('breaking change');
  if (kind === 'bug' && signals.regression === true) add('regression');

  const blocked =
    signals.blocked === true ||
    relationships.externalBlocker === true ||
    Boolean(relationships.blockedBy);
  if (blocked) add('blocked');

  const needsTriage =
    signals.needsTriage === true || !kind || !actionable || !hasAcceptanceCriteria;
  if (needsTriage) add('needs triage');
  if (kind === 'bug' && reproductionAvailable === false) add('needs reproduction');

  const eligibleFirstIssue =
    signals.goodFirstIssue === true &&
    actionable &&
    hasAcceptanceCriteria &&
    !needsTriage &&
    !blocked &&
    metadata.complexity === 'low' &&
    [1, 2, 3].includes(metadata.workSize);
  if (eligibleFirstIssue) add('good first issue');
  else if (signals.goodFirstIssue === true) {
    warnings.push('good first issue was not proposed because its eligibility rules are not met.');
  }

  const eligibleHelpWanted =
    signals.helpWanted === true && actionable && hasAcceptanceCriteria && !needsTriage;
  if (eligibleHelpWanted) add('help wanted');
  else if (signals.helpWanted === true) {
    warnings.push(
      'help wanted was not proposed because the task is not fully actionable and triaged.',
    );
  }

  const known = Array.isArray(availableLabels)
    ? new Set(
        availableLabels.map((label) =>
          (typeof label === 'string' ? label : label.name).toLowerCase(),
        ),
      )
    : null;
  const apply = known ? desired.filter((label) => known.has(label)) : [];
  const missing = known ? desired.filter((label) => !known.has(label)) : [];
  const unresolved = known ? [] : [...desired];
  if (missing.length > 0) {
    warnings.push(
      `Canonical label definitions are absent and will not be created: ${missing.join(', ')}.`,
    );
  }
  if (unresolved.length > 0) {
    warnings.push(
      'Repository label availability could not be verified; label plans remain unresolved.',
    );
  }

  return {
    desired: desired.filter((label) => Object.hasOwn(CANONICAL_LABELS, label)),
    apply,
    missing,
    unresolved,
    warnings,
  };
}
