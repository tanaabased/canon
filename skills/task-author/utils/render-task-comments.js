import { SCORE_FORMULA_VERSION, displayValue } from '../lib/task-author-contract.js';

/** Render the durable calculation evidence that must accompany a persisted score. */
export function renderTaskScoreComment(scoring, rationales = {}) {
  if (!scoring || scoring.score === null) return '';
  const { factors } = scoring;
  const line = (key, label) => {
    const factor = factors[key];
    const rationale = rationales[key] ? ` — ${rationales[key]}` : '';
    return `- ${label}: ${displayValue(factor.level)} (\`${factor.value.toFixed(2)}\`)${rationale}`;
  };

  return [
    `Task score: ${scoring.score} (\`${SCORE_FORMULA_VERSION}\`)`,
    '',
    line('impact', 'Impact'),
    line('urgency', 'Urgency'),
    line('enablement', 'Enablement'),
    `- Work size: \`${factors.workSize.value}\``,
    line('confidence', 'Confidence'),
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
