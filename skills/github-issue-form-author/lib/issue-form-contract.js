import taskManagementSchema from '../../../references/task-management-schema.json' with { type: 'json' };

export const REPOSITORY_MODES = Object.freeze(['organization', 'personal']);

export const TASK_KINDS = Object.freeze(
  Object.fromEntries(taskManagementSchema.issueTypes.map(({ key, name }) => [key, { key, name }])),
);

export function issueFormName(kind) {
  if (!TASK_KINDS[kind]) throw new Error(`Unsupported task kind: ${kind}`);
  if (kind === 'bug') return 'Bug report';
  if (kind === 'feature') return 'Feature request';
  return TASK_KINDS[kind].name;
}

const ADDITIONAL_CONTEXT = Object.freeze({
  id: 'additional-context',
  label: 'Additional context',
  description:
    'Share relevant constraints, dependencies, deadlines, logs, screenshots, or other evidence.',
  required: false,
});

const TASK_CONTEXT = Object.freeze({
  id: 'task-context',
  label: 'What constraints, inputs, or approvals should we know about?',
  description:
    'Include relevant deadlines, budgets, people, access, links, files, dependencies, privacy concerns, or actions requiring approval. Do not include secrets.',
  required: false,
});

const FEATURE_CONTEXT = Object.freeze({
  id: 'additional-context',
  label: 'Additional context',
  description:
    'Optionally share examples, mockups, comparable behavior, links, compatibility concerns, constraints, or dependencies.',
  required: false,
});

/** Human-oriented evidence prompts; canonical task headings are produced during normalization. */
export const INTAKE_FORMS = Object.freeze({
  task: Object.freeze([
    Object.freeze({
      id: 'work',
      label: 'What needs to be done, and why?',
      description:
        'Describe the current situation, the result you want, and who or what is affected.',
      required: true,
    }),
    Object.freeze({
      id: 'completion',
      label: 'How will we know it is complete?',
      description:
        'Describe the observable result, deliverable, or external state. Formal acceptance criteria are not required.',
      required: true,
    }),
    TASK_CONTEXT,
  ]),
  bug: Object.freeze([
    Object.freeze({
      id: 'observed',
      label: 'What happened?',
      description: 'Describe the behavior you observed, when it occurred, and how it affected you.',
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
        'Provide steps, inputs, affected versions or environments, logs, or other direct evidence. Do not perform risky or machine-mutating actions solely to complete this report.',
      required: true,
    }),
    ADDITIONAL_CONTEXT,
  ]),
  feature: Object.freeze([
    Object.freeze({
      id: 'problem',
      label: 'What problem or opportunity are you seeing?',
      description:
        'Describe the affected users or workflows, the current experience or workaround, and why it matters.',
      required: true,
    }),
    Object.freeze({
      id: 'outcome',
      label: 'What outcome would help?',
      description:
        'Describe the capability or result you want and an example of how it would be used. Avoid prescribing implementation details unless they are essential.',
      required: true,
    }),
    FEATURE_CONTEXT,
  ]),
});
