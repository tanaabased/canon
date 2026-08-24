import { REPOSITORY_MODES, TASK_KINDS, issueFormName } from './issue-form-contract.js';

function responseText(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed === '_No response_' ? '' : trimmed;
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
    Object.entries(responses).map(([id, lines]) => [id, responseText(lines.join('\n'))]),
  );
}

function formTaskKind(form) {
  const byType = String(form.type ?? '')
    .trim()
    .toLowerCase();
  if (TASK_KINDS[byType]) return byType;
  return Object.keys(TASK_KINDS).find((kind) => issueFormName(kind) === form.name) ?? null;
}

function evidenceResponses(form, responses) {
  return Object.fromEntries(
    form.body
      .filter(({ type }) => type !== 'markdown')
      .flatMap((element) => {
        const value = responseText(responses[element.id]);
        if (!value) return [];
        return [
          [
            element.id,
            {
              label: element.attributes.label,
              value,
              required: element.validations?.required === true,
            },
          ],
        ];
      }),
  );
}

/** Preserve one submitted form as evidence for Task Author's semantic normalization pass. */
export function normalizeIssueFormSubmission(
  markdown,
  { form, repositoryMode, nativeMetadata = {}, title = '' } = {},
) {
  if (!form || !Array.isArray(form.body)) throw new Error('A generated issue form is required.');
  if (!REPOSITORY_MODES.includes(repositoryMode)) {
    throw new Error(`repositoryMode must be one of: ${REPOSITORY_MODES.join(', ')}.`);
  }

  const kind = formTaskKind(form);
  if (!kind) throw new Error('Submitted form does not identify a supported task kind.');
  const rawMarkdown = String(markdown).trim();
  const responses = parseKnownResponses(rawMarkdown, form);

  return {
    title: String(title).trim(),
    kind,
    originalBody: rawMarkdown,
    intakeEvidence: {
      source: 'github_issue_form',
      repositoryMode,
      responses: evidenceResponses(form, responses),
      rawMarkdown,
    },
    metadata: repositoryMode === 'organization' ? { ...nativeMetadata } : {},
    signals: {},
    relationships: {},
    normalizationRequired: true,
  };
}
