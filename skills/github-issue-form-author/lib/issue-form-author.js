import {
  INTAKE_FORMS,
  REPOSITORY_MODES,
  TASK_KINDS,
  issueFormName,
} from './issue-form-contract.js';
import { serializeYaml } from '../utils/serialize-yaml.js';

function validateRepositoryMode(repositoryMode) {
  if (!REPOSITORY_MODES.includes(repositoryMode)) {
    throw new Error(`repositoryMode must be one of: ${REPOSITORY_MODES.join(', ')}.`);
  }
}

function intakeElements(kind) {
  return INTAKE_FORMS[kind].map(({ id, label, description, required }) => ({
    type: 'textarea',
    id,
    attributes: { label, description },
    validations: { required },
  }));
}

function validateElements(body) {
  const ids = new Set();
  const labels = new Set();
  let inputCount = 0;
  for (const element of body) {
    if (element.type === 'markdown') continue;
    inputCount += 1;
    if (!element.id) throw new Error('Every submitted issue-form element requires an id.');
    if (ids.has(element.id)) throw new Error(`Generated form contains duplicate id: ${element.id}`);
    ids.add(element.id);

    const label = element.attributes?.label;
    if (!label) throw new Error(`Generated form element ${element.id} requires a label.`);
    if (labels.has(label)) throw new Error(`Generated form contains duplicate label: ${label}`);
    labels.add(label);
  }
  if (inputCount === 0) throw new Error('GitHub issue forms require at least one submitted input.');
}

/** Build one low-friction GitHub intake form without writing files or publishing to GitHub. */
export function authorIssueForm(kind, repositoryMode) {
  validateRepositoryMode(repositoryMode);
  const taskKind = TASK_KINDS[kind];
  if (!taskKind) throw new Error(`Unsupported task kind: ${kind}`);

  const body = [
    {
      type: 'markdown',
      attributes: {
        value:
          'Share the evidence you have. A maintainer or agent will normalize the report, estimate task metadata, and ask focused follow-up questions when needed.',
      },
    },
    ...intakeElements(kind),
  ];
  validateElements(body);

  const name = issueFormName(kind);
  if (name.length <= 3)
    throw new Error('GitHub issue-form names must be longer than 3 characters.');

  return {
    name,
    description:
      kind === 'feature'
        ? 'Suggest a new or improved capability for triage and normalization.'
        : `Share a ${taskKind.name.toLowerCase()} for triage and normalization.`,
    ...(repositoryMode === 'organization' ? { type: kind } : {}),
    body,
  };
}

/** Build the complete Task, Bug, Feature, and chooser file set for one repository mode. */
export function authorIssueFormSet(repositoryMode) {
  validateRepositoryMode(repositoryMode);
  const forms = Object.keys(TASK_KINDS).map((kind) => {
    const document = authorIssueForm(kind, repositoryMode);
    return {
      kind,
      path: `.github/ISSUE_TEMPLATE/${kind}.yml`,
      document,
      content: serializeYaml(document),
    };
  });
  const configDocument = { blank_issues_enabled: false };

  return {
    mode: 'render',
    mutatesGitHub: false,
    repositoryMode,
    status: 'ready',
    files: [
      ...forms,
      {
        kind: null,
        path: '.github/ISSUE_TEMPLATE/config.yml',
        document: configDocument,
        content: serializeYaml(configDocument),
      },
    ],
    warnings: [
      'GitHub issue forms remain in public preview and must be revalidated against the current form schema before publication.',
      ...(repositoryMode === 'personal'
        ? [
            'Personal repositories lack issue types and issue fields; Task Author adds supported fallback metadata after semantic normalization.',
          ]
        : []),
    ],
    operations: [],
  };
}
