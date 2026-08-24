function rawMilestone(input = {}) {
  return {
    closed_issues: input.closed_issues ?? 0,
    description: input.description ?? '',
    due_on: input.due_on ?? null,
    html_url: input.html_url ?? `https://github.com/acme/widgets/milestone/${input.number}`,
    number: input.number,
    open_issues: input.open_issues ?? 0,
    state: input.state ?? 'open',
    title: input.title,
  };
}

function rawTask(input = {}) {
  return {
    html_url: input.html_url ?? `https://github.com/acme/widgets/issues/${input.number}`,
    milestone: input.milestone
      ? { number: input.milestone.number, title: input.milestone.title }
      : null,
    number: input.number,
    ...(input.pullRequest ? { pull_request: { url: 'https://api.github.com/pulls/1' } } : {}),
    state: input.state ?? 'open',
    title: input.title ?? `Task ${input.number}`,
  };
}

export function milestoneFixture(input = {}) {
  return rawMilestone({
    description: input.description ?? '',
    due_on: input.dueOn ?? null,
    number: input.number ?? 4,
    state: input.state ?? 'open',
    title: input.title ?? 'Ship the milestone',
  });
}

export function taskFixture(input = {}) {
  return rawTask(input);
}

export function fakeGitHubMilestoneClient(options = {}) {
  const calls = [];
  const state = {
    milestones: structuredClone(options.milestones ?? [milestoneFixture()]),
    tasks: structuredClone(options.tasks ?? []),
  };
  const failedMembership = new Set(options.membershipFailures ?? []);
  const droppedMembership = new Set(options.dropMembership ?? []);
  const droppedFields = new Set(options.dropMilestoneFields ?? []);

  function result(value) {
    return { ok: true, value: structuredClone(value) };
  }

  return {
    calls,
    state,
    ensureAvailable() {
      calls.push('ensureAvailable');
      if (options.availabilityFailure) throw new Error(options.availabilityFailure);
      return options.authWarning ? [options.authWarning] : [];
    },
    readRepository(slug) {
      calls.push({ operation: 'readRepository', slug });
      return options.repositoryFailure
        ? { ok: false, error: options.repositoryFailure }
        : result({ full_name: slug });
    },
    listMilestones(slug) {
      calls.push({ operation: 'listMilestones', slug });
      return options.listFailure
        ? { ok: false, error: options.listFailure }
        : result(state.milestones);
    },
    readMilestone(slug, number) {
      calls.push({ number, operation: 'readMilestone', slug });
      if (options.milestoneReadFailure) return { ok: false, error: options.milestoneReadFailure };
      const milestone = state.milestones.find((value) => value.number === number);
      return milestone
        ? result(milestone)
        : { ok: false, error: `GET milestone #${number}: HTTP 404` };
    },
    createMilestone(slug, payload) {
      calls.push({ operation: 'createMilestone', payload: structuredClone(payload), slug });
      if (options.createFailure) return { ok: false, error: options.createFailure };
      const number = Math.max(0, ...state.milestones.map((value) => value.number)) + 1;
      const milestone = rawMilestone({
        description: droppedFields.has('description') ? '' : payload.description,
        due_on: droppedFields.has('due_on') ? null : (payload.due_on ?? null),
        number,
        state: payload.state ?? 'open',
        title: droppedFields.has('title') ? 'Dropped title' : payload.title,
      });
      state.milestones.push(milestone);
      return result(options.omitCreatedNumber ? { ...milestone, number: null } : milestone);
    },
    updateMilestone(slug, number, payload) {
      calls.push({ number, operation: 'updateMilestone', payload: structuredClone(payload), slug });
      const milestone = state.milestones.find((value) => value.number === number);
      if (!milestone) return { ok: false, error: `PATCH milestone #${number}: HTTP 404` };
      if (options.updateFailure && !options.updateFailureAfterApply) {
        return { ok: false, error: options.updateFailure };
      }
      if (payload.title !== undefined && !droppedFields.has('title'))
        milestone.title = payload.title;
      if (payload.description !== undefined && !droppedFields.has('description')) {
        milestone.description = payload.description;
      }
      if (payload.state !== undefined && !droppedFields.has('state'))
        milestone.state = payload.state;
      if (payload.due_on !== undefined && !droppedFields.has('due_on')) {
        milestone.due_on = payload.due_on;
      }
      if (options.updateFailureAfterApply) {
        return { ok: false, error: options.updateFailureAfterApply };
      }
      return result(milestone);
    },
    listMilestoneMembers(slug, number) {
      calls.push({ number, operation: 'listMilestoneMembers', slug });
      if (options.membersReadFailure) return { ok: false, error: options.membersReadFailure };
      return result(state.tasks.filter((task) => task.milestone?.number === number));
    },
    readTask(slug, number) {
      calls.push({ number, operation: 'readTask', slug });
      if ((options.taskReadFailures ?? []).includes(number)) {
        return { ok: false, error: `GET task #${number}: HTTP 403` };
      }
      const task = state.tasks.find((value) => value.number === number);
      return task ? result(task) : { ok: false, error: `GET task #${number}: HTTP 404` };
    },
    updateTaskMilestone(slug, number, milestoneNumber) {
      calls.push({ milestoneNumber, number, operation: 'updateTaskMilestone', slug });
      if (failedMembership.has(number)) {
        return { ok: false, error: `PATCH task #${number}: HTTP 403` };
      }
      const task = state.tasks.find((value) => value.number === number);
      if (!task) return { ok: false, error: `PATCH task #${number}: HTTP 404` };
      if (!droppedMembership.has(number)) {
        const milestone = state.milestones.find((value) => value.number === milestoneNumber);
        task.milestone = milestone ? { number: milestone.number, title: milestone.title } : null;
      }
      return result(task);
    },
  };
}
