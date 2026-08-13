import {
  BODY_SHAPES,
  PERSONAL_METADATA_FIELDS,
  REPOSITORY_MODES,
  SCORING_DIAGNOSTICS,
  SIGNAL_OPTIONS,
  TASK_KINDS,
  displayValue,
  formId,
  issueFormName,
  scoringFormOption,
  sectionPrompt,
} from './issue-form-contract.js';
import { serializeYaml } from '../utils/serialize-yaml.js';

function validateRepositoryMode(repositoryMode) {
  if (!REPOSITORY_MODES.includes(repositoryMode)) {
    throw new Error(`repositoryMode must be one of: ${REPOSITORY_MODES.join(', ')}.`);
  }
}

function sectionElements(kind) {
  const elements = BODY_SHAPES[kind]
    .filter(({ key }) => key !== null)
    .map(({ heading, key, required }) => ({
      type: 'textarea',
      id: formId(key),
      attributes: {
        label: heading,
        description: sectionPrompt(key),
        ...(key === 'acceptanceCriteria' || key === 'inScope' || key === 'outOfScope'
          ? { placeholder: 'One item per line' }
          : {}),
      },
      validations: { required },
    }));

  if (kind === 'bug') {
    const reproductionIndex = elements.findIndex(({ id }) => id === 'reproduction');
    elements.splice(reproductionIndex + 1, 0, {
      type: 'textarea',
      id: 'environment',
      attributes: {
        label: 'Environment',
        description: 'Record relevant versions, operating systems, runtimes, or configuration.',
      },
      validations: { required: false },
    });
  }
  return elements;
}

function personalMetadataElements(kind) {
  const taskKind = {
    type: 'dropdown',
    id: 'task-kind',
    attributes: {
      label: 'Task kind',
      description: 'Portable task kind because personal repositories do not support issue types.',
      options: [TASK_KINDS[kind].name],
      default: 0,
    },
    validations: { required: true },
  };
  const metadata = PERSONAL_METADATA_FIELDS.map((field) => ({
    type: field.type,
    id: field.id,
    attributes: {
      label: field.label,
      description:
        field.type === 'input'
          ? 'Optional ISO YYYY-MM-DD value; leave blank when unknown.'
          : 'Select only when the submitted evidence supports an estimate; otherwise leave unset.',
      ...(field.options ? { options: field.options } : {}),
    },
    validations: { required: false },
  }));
  return [taskKind, ...metadata];
}

function scoringElements() {
  return Object.entries(SCORING_DIAGNOSTICS).map(([key, options]) => ({
    type: 'dropdown',
    id: key,
    attributes: {
      label: `${displayValue(key)} assessment`,
      description:
        'Select only when the task evidence supports this assessment; otherwise leave unset.',
      options: options.map((option) => scoringFormOption(key, option)),
    },
    validations: { required: false },
  }));
}

function signalElement(kind) {
  return {
    type: 'checkboxes',
    id: 'task-signals',
    attributes: {
      label: 'Task signals',
      description:
        'Select only statements directly supported by the submission. Canonical labels are applied later only when their repository definitions exist.',
      options: SIGNAL_OPTIONS.filter(({ kinds }) => kinds.includes(kind)).map(({ label }) => ({
        label,
      })),
    },
    validations: { required: false },
  };
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

/** Build one canonical GitHub issue form without writing files or publishing to GitHub. */
export function authorIssueForm(kind, repositoryMode) {
  validateRepositoryMode(repositoryMode);
  const taskKind = TASK_KINDS[kind];
  if (!taskKind) throw new Error(`Unsupported task kind: ${kind}`);

  const body = [
    {
      type: 'markdown',
      attributes: {
        value:
          'Provide supported evidence and leave uncertain estimates unset. Task score is calculated after submission; do not calculate it here.',
      },
    },
    ...(repositoryMode === 'personal' ? personalMetadataElements(kind) : []),
    ...sectionElements(kind),
    ...scoringElements(),
    signalElement(kind),
  ];
  validateElements(body);

  const name = issueFormName(kind);
  if (name.length <= 3)
    throw new Error('GitHub issue-form names must be longer than 3 characters.');

  return {
    name,
    description: `Propose a canonical ${taskKind.name.toLowerCase()} with enough evidence for triage and estimation.`,
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
            'Personal repositories lack issue types and issue fields; canonical metadata is rendered for later fallback normalization.',
          ]
        : []),
    ],
    operations: [],
  };
}
