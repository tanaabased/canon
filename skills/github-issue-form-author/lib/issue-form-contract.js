import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };

export const REPOSITORY_MODES = Object.freeze(['organization', 'personal']);

export const TASK_KINDS = Object.freeze(
  Object.fromEntries(taskManagementSchema.issueTypes.map(({ key, name }) => [key, { key, name }])),
);

export function issueFormName(kind) {
  if (!TASK_KINDS[kind]) throw new Error(`Unsupported task kind: ${kind}`);
  return kind === 'bug' ? 'Bug report' : TASK_KINDS[kind].name;
}

const ADDITIONAL_CONTEXT = Object.freeze({
  id: 'additional-context',
  label: 'Additional context',
  description:
    'Share relevant constraints, dependencies, deadlines, logs, screenshots, or other evidence.',
  required: false,
});

/** Human-oriented evidence prompts; canonical task headings are produced during normalization. */
export const INTAKE_FORMS = Object.freeze({
  task: Object.freeze([
    Object.freeze({
      id: 'change',
      label: 'What needs to change, and why?',
      description:
        'Describe the current situation, the affected workflow, and the change you need.',
      required: true,
    }),
    Object.freeze({
      id: 'success',
      label: 'What would a successful result look like?',
      description: 'Describe the observable outcome. Formal acceptance criteria are not required.',
      required: true,
    }),
    ADDITIONAL_CONTEXT,
  ]),
  bug: Object.freeze([
    Object.freeze({
      id: 'observed',
      label: 'What happened?',
      description: 'Describe the behavior you observed and when it occurred.',
      required: true,
    }),
    Object.freeze({
      id: 'expected',
      label: 'What did you expect?',
      description: 'Describe the behavior that should have occurred instead.',
      required: true,
    }),
    Object.freeze({
      id: 'investigation',
      label: 'How can we reproduce or investigate it?',
      description:
        'Provide steps when reproducible. Otherwise share occurrence details, environment, versions, logs, or other direct evidence.',
      required: true,
    }),
    ADDITIONAL_CONTEXT,
  ]),
  feature: Object.freeze([
    Object.freeze({
      id: 'problem',
      label: 'What problem or opportunity are you seeing?',
      description: 'Describe the capability gap, affected users or workflows, and why it matters.',
      required: true,
    }),
    Object.freeze({
      id: 'outcome',
      label: 'What outcome would help?',
      description:
        'Describe the useful result without prescribing unnecessary implementation detail.',
      required: true,
    }),
    ADDITIONAL_CONTEXT,
  ]),
});
