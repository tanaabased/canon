import { organizationCapabilities } from '../../../test/task-management-fixtures.js';

function clone(value) {
  return structuredClone(value);
}

function fieldDefinition(capabilities, fieldId) {
  return capabilities.issueFields.values.find(({ id }) => Number(id) === Number(fieldId));
}

function result(value) {
  return { ok: true, value: clone(value) };
}

export function fakeGitHubTaskDecomposerClient(options = {}) {
  const capabilities = clone(options.capabilities ?? organizationCapabilities());
  const calls = [];
  const issues = new Map(
    (options.issues ?? []).map((issue) => [Number(issue.number), clone(issue)]),
  );
  const fields = new Map(
    Object.entries(options.fields ?? {}).map(([number, values]) => [Number(number), clone(values)]),
  );
  const comments = new Map(
    Object.entries(options.comments ?? {}).map(([number, values]) => [
      Number(number),
      clone(values),
    ]),
  );
  const parents = new Map(
    Object.entries(options.parents ?? {}).map(([child, parent]) => [Number(child), Number(parent)]),
  );
  const subIssues = new Map();
  for (const [child, parent] of parents) {
    if (!subIssues.has(parent)) subIssues.set(parent, new Set());
    subIssues.get(parent).add(child);
  }
  const blockedBy = new Map(
    Object.entries(options.blockedBy ?? {}).map(([number, values]) => [
      Number(number),
      new Set(values.map(Number)),
    ]),
  );
  const state = {
    issues,
    fields,
    comments,
    parents,
    subIssues,
    blockedBy,
    failOperation: options.failOperation ?? null,
  };

  function failure(operation) {
    return state.failOperation === operation
      ? { ok: false, error: `${operation}: HTTP 403` }
      : null;
  }

  function issueResult(number) {
    const issue = issues.get(Number(number));
    return issue ? result(issue) : { ok: false, error: `GET issue #${number}: HTTP 404` };
  }

  return {
    calls,
    state,
    ensureAvailable() {
      calls.push('ensureAvailable');
      if (options.availabilityFailure) throw new Error(options.availabilityFailure);
      return options.warnings ?? [];
    },
    resolveCurrentRepository() {
      return capabilities.repository.slug;
    },
    inspectRepository(target) {
      calls.push({ operation: 'inspectRepository', target: target.slug });
      return clone(capabilities);
    },
    readIssue(target, issueNumber) {
      calls.push({ operation: 'readIssue', issueNumber, target: target.slug });
      return issueResult(issueNumber);
    },
    readIssueFieldValues(target, issueNumber) {
      calls.push({ operation: 'readIssueFieldValues', issueNumber, target: target.slug });
      return result(fields.get(Number(issueNumber)) ?? []);
    },
    readComments(target, issueNumber) {
      calls.push({ operation: 'readComments', issueNumber, target: target.slug });
      return result(comments.get(Number(issueNumber)) ?? []);
    },
    readTimeline(target, issueNumber) {
      calls.push({ operation: 'readTimeline', issueNumber, target: target.slug });
      return result(options.timeline ?? []);
    },
    readParent(target, issueNumber) {
      calls.push({ operation: 'readParent', issueNumber, target: target.slug });
      const parentNumber = parents.get(Number(issueNumber));
      return parentNumber
        ? issueResult(parentNumber)
        : { ok: false, error: `GET parent for #${issueNumber}: HTTP 404` };
    },
    listSubIssues(target, issueNumber) {
      calls.push({ operation: 'listSubIssues', issueNumber, target: target.slug });
      const numbers = [...(subIssues.get(Number(issueNumber)) ?? [])];
      return result(numbers.map((number) => issues.get(number)).filter(Boolean));
    },
    listBlockedBy(target, issueNumber) {
      calls.push({ operation: 'listBlockedBy', issueNumber, target: target.slug });
      const numbers = [...(blockedBy.get(Number(issueNumber)) ?? [])];
      return result(numbers.map((number) => issues.get(number)).filter(Boolean));
    },
    listBlocking(target, issueNumber) {
      calls.push({ operation: 'listBlocking', issueNumber, target: target.slug });
      const blockingNumbers = [...blockedBy.entries()]
        .filter(([, blockers]) => blockers.has(Number(issueNumber)))
        .map(([number]) => number);
      return result(blockingNumbers.map((number) => issues.get(number)).filter(Boolean));
    },
    listRepositoryIssues(target) {
      calls.push({ operation: 'listRepositoryIssues', target: target.slug });
      return result([...issues.values()]);
    },
    searchIssuesByTitle(target, title) {
      calls.push({ operation: 'searchIssuesByTitle', target: target.slug, title });
      return result(
        [...issues.values()].filter(
          (issue) => !issue.pull_request && String(issue.title).includes(String(title)),
        ),
      );
    },
    createIssue(target, payload) {
      calls.push({ operation: 'createIssue', payload: clone(payload), target: target.slug });
      const failed = failure('createIssue');
      if (failed) return failed;
      const number = Math.max(0, ...issues.keys()) + 1;
      const id = 10_000 + number;
      const issue = {
        id,
        number,
        html_url: `https://github.com/${target.slug}/issues/${number}`,
        title: payload.title,
        body: payload.body,
        state: 'open',
        state_reason: null,
        type: payload.type ? { name: payload.type } : null,
        labels: (payload.labels ?? []).map((name) => ({ name })),
        assignees: [],
        milestone: null,
      };
      issues.set(number, issue);
      fields.set(
        number,
        (payload.issue_field_values ?? []).map(({ field_id: fieldId, value }) => {
          const definition = fieldDefinition(capabilities, fieldId);
          return {
            issue_field_id: fieldId,
            data_type: definition?.data_type,
            value: definition?.data_type === 'single_select' ? null : value,
            single_select_option:
              definition?.data_type === 'single_select' ? { name: value } : null,
          };
        }),
      );
      comments.set(number, []);
      return result(issue);
    },
    updateIssue(target, issueNumber, payload) {
      calls.push({
        operation: 'updateIssue',
        issueNumber,
        payload: clone(payload),
        target: target.slug,
      });
      const failed = failure('updateIssue');
      if (failed) return failed;
      const issue = issues.get(Number(issueNumber));
      if (!issue) return { ok: false, error: `PATCH issue #${issueNumber}: HTTP 404` };
      Object.assign(
        issue,
        options.dropParentBody && Number(issueNumber) === 1
          ? Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'body'))
          : payload,
      );
      return result(issue);
    },
    addComment(target, issueNumber, body) {
      calls.push({ operation: 'addComment', issueNumber, body, target: target.slug });
      const failed = failure('addComment');
      if (failed) return failed;
      const values = comments.get(Number(issueNumber)) ?? [];
      const comment = { id: values.length + 1, body, user: { login: 'pirog' } };
      values.push(comment);
      comments.set(Number(issueNumber), values);
      return result(comment);
    },
    addSubIssue(target, parentNumber, subIssueId) {
      calls.push({ operation: 'addSubIssue', parentNumber, subIssueId, target: target.slug });
      const failed = failure('addSubIssue');
      if (failed) return failed;
      const child = [...issues.values()].find(({ id }) => Number(id) === Number(subIssueId));
      if (!child) return { ok: false, error: `Sub-issue id ${subIssueId} was not found.` };
      parents.set(child.number, Number(parentNumber));
      if (!subIssues.has(Number(parentNumber))) subIssues.set(Number(parentNumber), new Set());
      subIssues.get(Number(parentNumber)).add(child.number);
      return result(child);
    },
    addBlockedBy(target, issueNumber, blockingIssueId) {
      calls.push({ operation: 'addBlockedBy', issueNumber, blockingIssueId, target: target.slug });
      const failed = failure('addBlockedBy');
      if (failed) return failed;
      const blocker = [...issues.values()].find(({ id }) => Number(id) === Number(blockingIssueId));
      if (!blocker)
        return { ok: false, error: `Blocking issue id ${blockingIssueId} was not found.` };
      if (!blockedBy.has(Number(issueNumber))) blockedBy.set(Number(issueNumber), new Set());
      blockedBy.get(Number(issueNumber)).add(blocker.number);
      return result(issues.get(Number(issueNumber)));
    },
  };
}
