const ASSESSMENT_KEYS = Object.freeze([
  'priority',
  'workSize',
  'complexity',
  'impact',
  'startDate',
  'targetDate',
  'urgency',
  'enablement',
  'confidence',
]);

const SOURCES = Object.freeze(['agent', 'human', 'policy', 'existing']);
const HUMAN_CONTROLLED = new Set(['priority', 'startDate', 'targetDate']);

function normalizedRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  return {
    source: String(record.source ?? '')
      .trim()
      .toLowerCase(),
    rationale: String(record.rationale ?? '').trim(),
  };
}

function effectiveValues(metadata, scoring) {
  return {
    ...Object.fromEntries(
      ['priority', 'workSize', 'complexity', 'impact', 'startDate', 'targetDate'].flatMap((key) =>
        metadata[key] === undefined ? [] : [[key, metadata[key]]],
      ),
    ),
    ...Object.fromEntries(
      ['urgency', 'enablement', 'confidence'].flatMap((key) => {
        const level = scoring.factors[key]?.level;
        return level === undefined ? [] : [[key, level]];
      }),
    ),
  };
}

/** Validate who supplied each accepted estimate and expose its review rationale. */
export function buildTaskAssessment(metadata = {}, scoring = {}, input = {}) {
  const errors = [];
  const values = {};
  const effective = effectiveValues(metadata, scoring);

  for (const key of Object.keys(input ?? {})) {
    if (!ASSESSMENT_KEYS.includes(key)) errors.push(`assessment.${key} is not supported.`);
  }

  for (const [key, value] of Object.entries(effective)) {
    const record = normalizedRecord(input?.[key]);
    if (!record) {
      errors.push(`assessment.${key} requires source and rationale provenance.`);
      continue;
    }
    if (!SOURCES.includes(record.source)) {
      errors.push(`assessment.${key}.source must be one of: ${SOURCES.join(', ')}.`);
    }
    if (record.source === 'agent' && !record.rationale) {
      errors.push(`assessment.${key}.rationale is required for an agent estimate.`);
    }
    if (HUMAN_CONTROLLED.has(key) && record.source === 'agent') {
      errors.push(
        `${key} is human- or policy-controlled and cannot be authored as an agent estimate.`,
      );
    }
    values[key] = { value, ...record };
  }

  for (const key of ASSESSMENT_KEYS) {
    if (input?.[key] !== undefined && effective[key] === undefined) {
      errors.push(`assessment.${key} cannot describe an unset value.`);
    }
  }

  if (scoring.score !== null) {
    values.taskScore = {
      value: scoring.score,
      source: 'derived',
      rationale: `Calculated from accepted inputs using ${scoring.formulaVersion}.`,
    };
  }

  return { values, errors };
}
