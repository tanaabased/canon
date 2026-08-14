import { SCORE_FORMULA_VERSION, displayValue } from '../lib/task-author-contract.js';

const SCORE_AUDIT_NOTE =
  'This machine-generated assessment reflects the evidence and accepted inputs currently recorded for this task. It is a prioritization aid, not a delivery commitment, schedule, severity determination, or maintainer decision.';
const SUPERSEDING_NOTE =
  'This assessment supersedes the previous automated task assessment on this issue.';

/** Return whether a body is a Task Author score-audit comment. */
export function isTaskScoreAuditComment(body = '') {
  const value = String(body);
  return (
    value.includes(`\`${SCORE_FORMULA_VERSION}\``) &&
    (value.startsWith('Task score:') || value.includes('<summary>Automated task assessment'))
  );
}

/** Mark a rendered score audit as superseding an earlier assessment. */
export function markTaskScoreCommentSuperseding(body = '') {
  const value = String(body);
  if (!value || value.includes(SUPERSEDING_NOTE)) return value;
  return value.replace(SCORE_AUDIT_NOTE, `${SCORE_AUDIT_NOTE}\n\n${SUPERSEDING_NOTE}`);
}

/** Render optional, collapsed calculation evidence for a persisted score. */
export function renderTaskScoreComment(scoring, rationales = {}) {
  if (!scoring || scoring.score === null) return '';
  const { factors } = scoring;
  const line = (key, label) => {
    const factor = factors[key];
    const rationale = rationales[key] ? ` — ${rationales[key]}` : '';
    return `- ${label}: ${displayValue(factor.level)} (\`${factor.value.toFixed(2)}\`)${rationale}`;
  };

  return [
    '<details>',
    `<summary>Automated task assessment — advisory · score ${scoring.score}/100</summary>`,
    '',
    SCORE_AUDIT_NOTE,
    '',
    `- Formula: \`${SCORE_FORMULA_VERSION}\``,
    line('impact', 'Impact'),
    line('urgency', 'Urgency'),
    line('enablement', 'Enablement'),
    `- Work size: \`${factors.workSize.value}\`${rationales.workSize ? ` — ${rationales.workSize}` : ''}`,
    line('confidence', 'Confidence'),
    '',
    '</details>',
    '',
  ].join('\n');
}

export function renderPriorityOverrideComment(priority, taskScore, rationale) {
  if (!priority || !rationale) return '';
  return [
    `Priority override: ${displayValue(priority)}`,
    '',
    `${String(rationale).trim()} Task score remains ${taskScore ?? 'unset'}; Priority is not a scoring input.`,
    '',
  ].join('\n');
}
