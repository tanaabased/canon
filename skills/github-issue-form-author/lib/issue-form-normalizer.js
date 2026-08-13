import {
  BODY_SHAPES,
  LIST_SECTION_KEYS,
  PERSONAL_METADATA_FIELDS,
  REPOSITORY_MODES,
  SIGNAL_OPTIONS,
  TASK_KINDS,
  formId,
  issueFormName,
  scoringCanonicalValue,
} from './issue-form-contract.js';

function normalizedValue(value) {
  const trimmed = responseText(value);
  if (!trimmed) return undefined;
  return trimmed.toLowerCase().replaceAll(' ', '-');
}

function responseText(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed === '_No response_' ? '' : trimmed;
}

function listValue(value) {
  return responseText(value)
    .split('\n')
    .map((line) => line.trim().replace(/^-\s+(?:\[[ xX]\]\s+)?/, ''))
    .filter(Boolean);
}

function checkedValues(value) {
  return String(value ?? '')
    .split('\n')
    .map((line) => line.match(/^-\s+\[[xX]\]\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function parseKnownResponses(markdown, form) {
  const labels = new Map();
  for (const element of form.body.filter(({ type }) => type !== 'markdown')) {
    const label = element.attributes.label;
    if (labels.has(label)) throw new Error(`Generated form contains duplicate label: ${label}`);
    labels.set(label, element.id);
  }
  const responses = {};
  let activeId = null;
  for (const line of String(markdown).split('\n')) {
    const heading = line.match(/^###\s+(.+)$/)?.[1]?.trim();
    if (heading && labels.has(heading)) {
      activeId = labels.get(heading);
      if (responses[activeId]) {
        throw new Error(`Submitted Markdown contains duplicate form heading: ${heading}`);
      }
      responses[activeId] = [];
      continue;
    }
    if (activeId) responses[activeId].push(line);
  }
  return Object.fromEntries(
    Object.entries(responses).map(([id, lines]) => [id, lines.join('\n').trim()]),
  );
}

function sectionValues(kind, responses) {
  const sections = Object.fromEntries(
    BODY_SHAPES[kind]
      .filter(({ key }) => key !== null)
      .map(({ key }) => {
        const value = responses[formId(key)];
        return [key, LIST_SECTION_KEYS.has(key) ? listValue(value) : responseText(value)];
      }),
  );
  if (kind === 'bug' && normalizedValue(responses.environment)) {
    sections.environment = responseText(responses.environment);
  }
  return sections;
}

function metadataValues(repositoryMode, responses, nativeMetadata) {
  if (repositoryMode === 'organization') return { ...nativeMetadata };
  return Object.fromEntries(
    PERSONAL_METADATA_FIELDS.flatMap(({ id, key }) => {
      const value = normalizedValue(responses[id]);
      if (value === undefined) return [];
      return [[key, key === 'workSize' ? Number(value) : value]];
    }),
  );
}

function formTaskKind(form) {
  return Object.keys(TASK_KINDS).find((kind) => issueFormName(kind) === form.name);
}

function signalValues(kind, responses) {
  const selected = new Set(checkedValues(responses['task-signals']));
  const signals = {};
  const relationships = {};
  for (const option of SIGNAL_OPTIONS.filter(({ kinds }) => kinds.includes(kind))) {
    if (!selected.has(option.label)) continue;
    if (option.signal) signals[option.signal] = true;
    if (option.relationship) relationships[option.relationship] = true;
  }
  return { relationships, signals };
}

/** Normalize submitted form Markdown into Task Author input without inventing missing evidence. */
export function normalizeIssueFormSubmission(
  markdown,
  { form, repositoryMode, nativeMetadata = {}, title = '' } = {},
) {
  if (!form || !Array.isArray(form.body)) throw new Error('A generated issue form is required.');
  if (!REPOSITORY_MODES.includes(repositoryMode)) {
    throw new Error(`repositoryMode must be one of: ${REPOSITORY_MODES.join(', ')}.`);
  }
  const responses = parseKnownResponses(markdown, form);
  const rawKind = form.type ?? responses['task-kind'] ?? formTaskKind(form);
  const kind = normalizedValue(rawKind);
  if (!TASK_KINDS[kind]) throw new Error('Submitted form does not identify a supported task kind.');

  const metadata = metadataValues(repositoryMode, responses, nativeMetadata);
  const scoring = Object.fromEntries(
    ['urgency', 'enablement', 'confidence'].flatMap((key) => {
      const value = normalizedValue(responses[key]);
      return value === undefined ? [] : [[key, scoringCanonicalValue(key, value)]];
    }),
  );
  const { relationships, signals } = signalValues(kind, responses);
  const sections = sectionValues(kind, responses);

  return {
    title: String(title).trim(),
    kind,
    sections,
    metadata,
    scoring,
    signals,
    relationships,
    ...(kind === 'bug' ? { reproductionAvailable: Boolean(sections.reproduction.trim()) } : {}),
  };
}
