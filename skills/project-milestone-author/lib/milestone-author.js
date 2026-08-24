import evaluatePublication from '../../../utils/evaluate-publication.js';
import planDigest from '../../../utils/plan-digest.js';
import normalizeMilestoneTarget from '../utils/normalize-milestone-target.js';
import { GitHubMilestoneClient } from './github-milestone-client.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DESIRED_FIELDS = new Set(['description', 'dueDate', 'state', 'title']);
const MEMBERSHIP_FIELDS = new Set(['add', 'allowMoveFromOtherMilestones', 'remove']);

function rejectUnknownFields(input, allowedFields, label) {
  const unknownFields = Object.keys(input)
    .filter((field) => !allowedFields.has(field))
    .sort();
  if (unknownFields.length > 0) {
    throw new Error(`${label} contains unsupported fields: ${unknownFields.join(', ')}.`);
  }
}

function normalizedMilestone(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    closedIssues: Number(value.closed_issues ?? 0),
    description: String(value.description ?? ''),
    dueOn: value.due_on ?? null,
    number: Number(value.number),
    openIssues: Number(value.open_issues ?? 0),
    state: value.state,
    title: value.title,
    url: value.html_url ?? null,
  };
}

function normalizedTask(value) {
  if (!value || typeof value !== 'object') return null;
  return {
    isPullRequest: Boolean(value.pull_request),
    milestone: value.milestone
      ? { number: Number(value.milestone.number), title: value.milestone.title }
      : null,
    number: Number(value.number),
    state: value.state,
    title: value.title,
    url: value.html_url ?? null,
  };
}

function milestoneSnapshot(milestone) {
  if (!milestone) return null;
  return {
    description: milestone.description,
    dueOn: milestone.dueOn,
    number: milestone.number,
    state: milestone.state,
    title: milestone.title,
  };
}

function blockedReport(target, blockers, warnings = [], mode = 'draft') {
  return {
    blockers,
    mode,
    mutatesGitHub: false,
    plannedMutation: null,
    publication: null,
    status: 'blocked',
    target: target?.slug ?? null,
    warnings,
  };
}

function canonicalTarget(target, milestone = null) {
  return milestone ? `${target.slug}#${milestone.number}` : target.slug;
}

function resolveExistingMilestone(client, target) {
  if (target.number !== null) {
    const result = client.readMilestone(target.slug, target.number);
    if (!result.ok) return { error: result.error, milestone: null };
    const milestone = normalizedMilestone(result.value);
    if (target.title !== null && milestone.title !== target.title) {
      return {
        error: `Milestone #${target.number} is titled ${JSON.stringify(milestone.title)}, not ${JSON.stringify(target.title)}.`,
        milestone: null,
      };
    }
    return { error: null, milestone };
  }

  if (target.title === null) {
    return {
      error: 'An existing milestone requires an exact milestone number, URL, or title selector.',
      milestone: null,
    };
  }

  const result = client.listMilestones(target.slug);
  if (!result.ok) return { error: result.error, milestone: null };
  const matches = result.value.filter((milestone) => milestone.title === target.title);
  if (matches.length !== 1) {
    return {
      error:
        matches.length === 0
          ? `No milestone titled ${JSON.stringify(target.title)} exists in ${target.slug}.`
          : `Multiple milestones titled ${JSON.stringify(target.title)} exist in ${target.slug}.`,
      milestone: null,
    };
  }
  return { error: null, milestone: normalizedMilestone(matches[0]) };
}

function validDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function titleValue(value) {
  const title = String(value ?? '').trim();
  if (!title) throw new Error('Project milestone title must not be empty.');
  if (title.includes('\n')) throw new Error('Project milestone title must be one line.');
  if (title.length > 255)
    throw new Error('Project milestone title must not exceed 255 characters.');
  return title;
}

function dueOnValue(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const date = String(value).trim();
  if (!validDate(date)) throw new Error('Due date must be null or a real YYYY-MM-DD date.');
  return `${date}T23:59:59Z`;
}

function taskNumbers(values, label) {
  if (values === undefined) return [];
  if (!Array.isArray(values)) throw new Error(`${label} must be a list of task numbers.`);
  const numbers = values.map(Number);
  if (numbers.some((number) => !Number.isInteger(number) || number <= 0)) {
    throw new Error(`${label} must contain only positive task numbers.`);
  }
  return [...new Set(numbers)].sort((left, right) => left - right);
}

function membershipRequest(input) {
  if (input === undefined) return null;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Membership must be an object with add and/or remove task-number lists.');
  }
  rejectUnknownFields(input, MEMBERSHIP_FIELDS, 'Membership');
  const add = taskNumbers(input.add, 'Membership add');
  const remove = taskNumbers(input.remove, 'Membership remove');
  const overlap = add.filter((number) => remove.includes(number));
  if (overlap.length > 0) {
    throw new Error(`Membership cannot add and remove the same task: ${overlap.join(', ')}.`);
  }
  if (add.length === 0 && remove.length === 0) {
    throw new Error('Membership requires at least one task to add or remove.');
  }
  return { add, allowMoveFromOtherMilestones: input.allowMoveFromOtherMilestones === true, remove };
}

function desiredMilestone(input, current, { create }) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    if (create) throw new Error('Creating a milestone requires a desired object.');
    return { expected: milestoneSnapshot(current), payload: null };
  }
  rejectUnknownFields(input, DESIRED_FIELDS, 'Desired');

  const expected = create
    ? { description: '', dueOn: null, number: null, state: 'open', title: null }
    : milestoneSnapshot(current);
  const payload = {};

  if (Object.hasOwn(input, 'title')) {
    const title = titleValue(input.title);
    expected.title = title;
    if (create || title !== current.title) payload.title = title;
  } else if (create) {
    throw new Error('Creating a milestone requires desired.title.');
  }

  if (Object.hasOwn(input, 'description')) {
    if (typeof input.description !== 'string') {
      throw new Error('Desired description must be the complete milestone description string.');
    }
    if (create && input.description.trim() === '') {
      throw new Error('Creating a milestone requires a nonempty desired.description.');
    }
    expected.description = input.description;
    if (create || input.description !== current.description)
      payload.description = input.description;
  } else if (create) {
    throw new Error('Creating a milestone requires desired.description.');
  }

  if (Object.hasOwn(input, 'state')) {
    if (!['open', 'closed'].includes(input.state)) {
      throw new Error('Desired state must be open or closed.');
    }
    expected.state = input.state;
    if (create || input.state !== current.state) payload.state = input.state;
  }

  if (Object.hasOwn(input, 'dueDate')) {
    const dueOn = dueOnValue(input.dueDate);
    expected.dueOn = dueOn;
    const currentDate = current?.dueOn?.slice(0, 10) ?? null;
    const desiredDate = dueOn?.slice(0, 10) ?? null;
    if (create ? dueOn !== null : currentDate !== desiredDate) payload.due_on = dueOn;
  }

  return { expected, payload: Object.keys(payload).length > 0 ? payload : null };
}

function titleConflict(client, slug, title, exceptNumber = null) {
  const result = client.listMilestones(slug);
  if (!result.ok) return result.error;
  const match = result.value.find(
    (milestone) => milestone.title === title && Number(milestone.number) !== exceptNumber,
  );
  return match
    ? `Milestone title ${JSON.stringify(title)} conflicts with existing milestone #${match.number}.`
    : null;
}

function selectedTaskPlan(client, slug, milestone, membership) {
  const blockers = [];
  const operations = [];
  const snapshot = [];
  const expected = [];
  if (!membership) return { blockers, expected, operations, snapshot };

  const requested = [
    ...membership.add.map((number) => ({ intent: 'add', number })),
    ...membership.remove.map((number) => ({ intent: 'remove', number })),
  ];
  for (const { intent, number } of requested) {
    const result = client.readTask(slug, number);
    if (!result.ok) {
      blockers.push(result.error);
      continue;
    }
    const task = normalizedTask(result.value);
    if (task.isPullRequest) {
      blockers.push(`GitHub item #${number} is a pull request, not a task.`);
      continue;
    }
    const before = task.milestone?.number ?? null;
    snapshot.push({ intent, milestoneNumber: before, number, title: task.title });
    if (
      intent === 'add' &&
      before !== null &&
      before !== milestone.number &&
      !membership.allowMoveFromOtherMilestones
    ) {
      blockers.push(
        `Task #${number} belongs to milestone #${before}; moving it requires allowMoveFromOtherMilestones: true.`,
      );
      continue;
    }
    const after = intent === 'add' ? milestone.number : before === milestone.number ? null : before;
    expected.push({ milestoneNumber: after, number });
    if (before !== after) {
      operations.push({ milestoneNumber: after, taskNumber: number, type: 'setTaskMilestone' });
    }
  }
  return { blockers, expected, operations, snapshot };
}

function publicationTexts(plan) {
  const operation = plan.operations.find(({ type }) =>
    ['createMilestone', 'updateMilestone'].includes(type),
  );
  return operation ? [operation.payload.title, operation.payload.description] : [];
}

function verificationCheck(checks, key, expected, observed) {
  checks.push({
    expected,
    key,
    observed,
    ok: JSON.stringify(expected) === JSON.stringify(observed),
  });
}

function verifyPlan(plan, milestone, tasks) {
  if (!milestone) {
    return {
      checks: [],
      errors: ['Project milestone readback was unavailable.'],
      mismatches: [],
      status: 'unavailable',
    };
  }
  const checks = [];
  verificationCheck(checks, 'milestone:title', plan.expected.milestone.title, milestone.title);
  verificationCheck(
    checks,
    'milestone:description',
    plan.expected.milestone.description,
    milestone.description,
  );
  verificationCheck(checks, 'milestone:state', plan.expected.milestone.state, milestone.state);
  verificationCheck(
    checks,
    'milestone:due-date',
    plan.expected.milestone.dueOn?.slice(0, 10) ?? null,
    milestone.dueOn?.slice(0, 10) ?? null,
  );
  const tasksByNumber = new Map(tasks.map((task) => [task.number, task]));
  for (const expected of plan.expected.selectedTasks) {
    verificationCheck(
      checks,
      `task:#${expected.number}:milestone`,
      expected.milestoneNumber,
      tasksByNumber.get(expected.number)?.milestone?.number ?? null,
    );
  }
  const mismatches = checks.filter(({ ok }) => !ok);
  return {
    checks,
    errors: [],
    mismatches,
    status: mismatches.length === 0 ? 'verified' : 'mismatch',
  };
}

function prepareClient(input, githubClient, mode) {
  let target;
  try {
    target = normalizeMilestoneTarget(input.target);
  } catch (error) {
    return { report: blockedReport(null, [error.message], [], mode) };
  }
  let warnings;
  try {
    warnings = githubClient.ensureAvailable();
  } catch (error) {
    return { report: blockedReport(target, [error.message], [], mode) };
  }
  const repository = githubClient.readRepository(target.slug);
  if (!repository.ok) return { report: blockedReport(target, [repository.error], warnings, mode) };
  return { target, warnings };
}

/** Inspect one exact project milestone and its current issue membership without writing. */
export function inspectMilestone(input = {}, { githubClient = new GitHubMilestoneClient() } = {}) {
  const prepared = prepareClient(input, githubClient, 'inspect');
  if (prepared.report) return prepared.report;
  const resolved = resolveExistingMilestone(githubClient, prepared.target);
  if (resolved.error) {
    return blockedReport(prepared.target, [resolved.error], prepared.warnings, 'inspect');
  }
  const membership = githubClient.listMilestoneMembers(
    prepared.target.slug,
    resolved.milestone.number,
  );
  const members = membership.ok ? membership.value.map(normalizedTask) : [];
  return {
    blockers: [],
    errors: membership.ok ? [] : [membership.error],
    milestone: resolved.milestone,
    mode: 'inspect',
    mutatesGitHub: false,
    pullRequestMembers: members.filter(({ isPullRequest }) => isPullRequest),
    status: membership.ok ? 'inspected' : 'partial',
    target: canonicalTarget(prepared.target, resolved.milestone),
    taskMembers: members.filter(({ isPullRequest }) => !isPullRequest),
    warnings: prepared.warnings,
  };
}

/** Build one fresh desired-state plan without writing to GitHub. */
export function planMilestone(input = {}, { githubClient = new GitHubMilestoneClient() } = {}) {
  const prepared = prepareClient(input, githubClient, 'draft');
  if (prepared.report) return prepared.report;
  const create = prepared.target.number === null && prepared.target.title === null;
  const blockers = [];
  let current = null;
  if (!create) {
    const resolved = resolveExistingMilestone(githubClient, prepared.target);
    if (resolved.error) blockers.push(resolved.error);
    current = resolved.milestone;
  }
  const canonical = canonicalTarget(prepared.target, current);

  let desired = { expected: milestoneSnapshot(current), payload: null };
  let membership = null;
  if (Object.hasOwn(input, 'desired') && Object.hasOwn(input, 'membership')) {
    blockers.push(
      'Milestone fields and task membership require separate plans and separate approvals.',
    );
  } else {
    try {
      desired = desiredMilestone(input.desired, current, { create });
      membership = membershipRequest(input.membership);
      if (create && membership)
        blockers.push('Create the milestone before changing task membership.');
    } catch (error) {
      blockers.push(error.message);
    }
  }

  let selected = { blockers: [], expected: [], operations: [], snapshot: [] };
  if (current && membership) {
    selected = selectedTaskPlan(githubClient, prepared.target.slug, current, membership);
    blockers.push(...selected.blockers);
  }

  if (desired.expected?.title && (create || desired.expected.title !== current?.title)) {
    const conflict = titleConflict(
      githubClient,
      prepared.target.slug,
      desired.expected.title,
      current?.number ?? null,
    );
    if (conflict) blockers.push(conflict);
  }

  const operations = [];
  if (desired.payload) {
    operations.push({
      ...(create ? {} : { number: current?.number }),
      payload: desired.payload,
      type: create ? 'createMilestone' : 'updateMilestone',
    });
  }
  operations.push(...selected.operations);
  const plan = {
    before: { milestone: milestoneSnapshot(current), selectedTasks: selected.snapshot },
    expected: { milestone: desired.expected, selectedTasks: selected.expected },
    kind: create ? 'create' : 'update',
    operations,
    target: canonical,
    version: 'tanaab/project-milestone-plan/v1',
  };
  const digest = planDigest(plan);
  const publication = evaluatePublication({
    digest,
    publication: input.publication,
    target: canonical,
    texts: publicationTexts(plan),
  });
  const status =
    blockers.length > 0
      ? 'blocked'
      : operations.length === 0
        ? 'aligned'
        : publication.findings.length > 0
          ? 'publication_blocked'
          : 'approval_required';
  return {
    blockers,
    current,
    mode: 'draft',
    mutatesGitHub: false,
    plannedMutation: plan,
    publication,
    status,
    target: canonical,
    warnings: prepared.warnings,
  };
}

/** Apply one fresh approved plan and verify every requested value through readback. */
export function applyMilestone(input = {}, { githubClient = new GitHubMilestoneClient() } = {}) {
  const preview = { ...planMilestone(input, { githubClient }), mode: 'apply' };
  if (['aligned', 'blocked'].includes(preview.status)) return preview;
  if (!preview.publication.approved) return preview;

  const plan = preview.plannedMutation;
  const slug = preview.target.split('#')[0];
  const writes = [];
  let milestoneNumber = preview.current?.number ?? null;
  for (const operation of plan.operations) {
    let result;
    if (operation.type === 'createMilestone') {
      result = githubClient.createMilestone(slug, operation.payload);
      milestoneNumber = result.ok ? Number(result.value.number ?? 0) || null : null;
    } else if (operation.type === 'updateMilestone') {
      result = githubClient.updateMilestone(slug, operation.number, operation.payload);
    } else {
      result = githubClient.updateTaskMilestone(
        slug,
        operation.taskNumber,
        operation.milestoneNumber,
      );
    }
    writes.push(
      result.ok
        ? { operation: operation.type, status: 'succeeded' }
        : { error: result.error, operation: operation.type, status: 'failed' },
    );
    if (operation.type === 'createMilestone' && (!result.ok || !milestoneNumber)) {
      return {
        ...preview,
        mode: 'apply',
        mutatesGitHub: result.ok,
        status: result.ok ? 'partial' : 'failed',
        verification: result.ok
          ? {
              checks: [],
              errors: ['GitHub created a milestone without returning its number.'],
              mismatches: [],
              status: 'unavailable',
            }
          : null,
        writes,
      };
    }
  }

  const milestoneRead = githubClient.readMilestone(slug, milestoneNumber);
  const verificationErrors = milestoneRead.ok ? [] : [milestoneRead.error];
  const tasks = [];
  for (const expected of plan.expected.selectedTasks) {
    const result = githubClient.readTask(slug, expected.number);
    if (result.ok) tasks.push(normalizedTask(result.value));
    else verificationErrors.push(result.error);
  }
  const verification = verifyPlan(
    plan,
    milestoneRead.ok ? normalizedMilestone(milestoneRead.value) : null,
    tasks,
  );
  verification.errors.push(...verificationErrors);
  if (verificationErrors.length > 0 && verification.status === 'verified') {
    verification.status = 'unavailable';
  }

  const successfulWrites = writes.filter(({ status }) => status === 'succeeded').length;
  const failedWrites = writes.some(({ status }) => status === 'failed');
  const verified = verification.status === 'verified' && verification.errors.length === 0;
  const observedEffect = writes.length > 0 && verified;
  return {
    ...preview,
    mode: 'apply',
    mutatesGitHub: successfulWrites > 0 || observedEffect,
    status:
      !failedWrites && verified
        ? plan.kind === 'create'
          ? 'created'
          : 'updated'
        : successfulWrites > 0 || observedEffect
          ? 'partial'
          : 'failed',
    verification,
    writes,
  };
}
