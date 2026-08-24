import { GitHubCapabilityClient } from './github-capability-client.js';
import { TASK_KINDS } from './task-author-contract.js';
import { buildTaskAssessment } from '../utils/build-task-assessment.js';
import { classifyTaskLabels } from '../utils/classify-task-labels.js';
import { normalizeTaskKind } from '../utils/normalize-task-kind.js';
import { normalizeTaskMetadata } from '../utils/normalize-task-metadata.js';
import { normalizeTaskTarget } from '../utils/normalize-task-target.js';
import { planTaskMetadata } from '../utils/plan-task-metadata.js';
import { renderFallbackMetadata } from '../utils/render-fallback-metadata.js';
import { renderTaskBody } from '../utils/render-task-body.js';

function appendBlock(body, block) {
  if (!block) return body;
  return `${body.trimEnd()}\n\n${block.trimStart()}`;
}

/** Build a complete Task Author preview without invoking any GitHub mutation. */
export function authorTaskDraft(input = {}, { githubClient = new GitHubCapabilityClient() } = {}) {
  const warnings = [];
  warnings.push(...githubClient.ensureAvailable());

  const resolvedInput = input.target ?? githubClient.resolveCurrentRepository();
  if (!resolvedInput) {
    throw new Error(
      'The GitHub repository target is ambiguous or unavailable. Supply an explicit OWNER/REPO.',
    );
  }
  const target = normalizeTaskTarget(resolvedInput);
  const capabilities = githubClient.inspectRepository(target);
  warnings.push(...capabilities.warnings);

  const kind = normalizeTaskKind(input.kind);
  const metadataResult = normalizeTaskMetadata(input.metadata);
  const assessment = buildTaskAssessment(metadataResult.values, input.assessment);

  const renderedBody = kind
    ? renderTaskBody(kind, input.sections)
    : { body: String(input.originalBody ?? ''), missing: ['kind'] };
  const acceptanceCriteria = input.sections?.acceptanceCriteria;
  const hasAcceptanceCriteria =
    Array.isArray(acceptanceCriteria) && acceptanceCriteria.some((item) => String(item).trim());
  const actionable = input.actionable ?? (kind !== null && renderedBody.missing.length === 0);

  const metadataPlan = planTaskMetadata(kind, metadataResult.values, capabilities, {
    forceFallbackKeys: input.forceFallbackKeys,
  });
  const fallbackBlock = renderFallbackMetadata(metadataPlan.fallback);
  const body = appendBlock(renderedBody.body, fallbackBlock);

  const availableLabels = capabilities.labels.status === 'ok' ? capabilities.labels.values : null;
  const labels = classifyTaskLabels({
    kind,
    metadata: metadataResult.values,
    signals: input.signals,
    actionable,
    hasAcceptanceCriteria,
    reproductionAvailable: input.reproductionAvailable,
    availableLabels,
    relationships: input.relationships,
  });

  warnings.push(...metadataPlan.warnings, ...labels.warnings);
  if (metadataResult.values.workSize === 13) {
    warnings.push('Work size 13 requires an explicit decomposition review before execution.');
  } else if (metadataResult.values.workSize === 21) {
    warnings.push(
      'Work size 21 is oversized and should normally be an acknowledged parent or planning task before decomposition.',
    );
  }

  const comments = [];

  const needsInput =
    !kind ||
    !String(input.title ?? '').trim() ||
    renderedBody.missing.length > 0 ||
    metadataResult.errors.length > 0 ||
    assessment.errors.length > 0 ||
    !actionable;
  const incompleteCapabilities =
    warnings.length > 0 ||
    metadataPlan.unresolved.length > 0 ||
    labels.missing.length > 0 ||
    labels.unresolved.length > 0;

  return {
    mode: 'draft',
    mutatesGitHub: false,
    status: needsInput ? 'needs_input' : incompleteCapabilities ? 'partial' : 'ready',
    target,
    title: String(input.title ?? '').trim(),
    taskKind: kind ? { key: kind, name: TASK_KINDS[kind] } : null,
    body,
    bodyEvidence: { missing: renderedBody.missing },
    metadata: {
      values: metadataResult.values,
      native: metadataPlan.native,
      fallback: metadataPlan.fallback,
      unresolved: metadataPlan.unresolved,
      errors: metadataResult.errors,
      warnings: metadataPlan.warnings,
    },
    assessment,
    labels,
    relationships: input.relationships ?? {},
    comments,
    capabilities,
    questions: input.questions ?? [],
    warnings,
    operations: ['read repository', 'read issue types', 'read issue fields', 'read labels'],
  };
}
