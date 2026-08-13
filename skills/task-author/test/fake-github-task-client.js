function fieldDefinition(capabilities, fieldId) {
  return capabilities.issueFields.values.find(({ id }) => Number(id) === Number(fieldId));
}

export function fakeGitHubTaskClient(capabilities, options = {}) {
  const calls = [];
  const state = { issue: null, fields: [], comments: [] };

  return {
    calls,
    state,
    ensureAvailable() {
      calls.push('ensureAvailable');
      return [];
    },
    resolveCurrentRepository() {
      calls.push('resolveCurrentRepository');
      return options.resolvedTarget ?? null;
    },
    inspectRepository(target) {
      calls.push(`inspectRepository:${target.slug}`);
      return capabilities;
    },
    createIssue(target, payload) {
      calls.push({ operation: 'createIssue', target: target.slug, payload });
      if (options.createFailure) return { ok: false, error: options.createFailure };

      state.issue = {
        number: options.issueNumber ?? 41,
        html_url: `https://github.com/${target.slug}/issues/${options.issueNumber ?? 41}`,
        title: payload.title,
        body: payload.body,
        type: options.dropType || !payload.type ? null : { name: payload.type },
        labels: options.dropLabels ? [] : (payload.labels ?? []).map((name) => ({ name })),
      };
      state.fields = options.dropFields
        ? []
        : (payload.issue_field_values ?? []).map(({ field_id: fieldId, value }) => {
            const definition = fieldDefinition(capabilities, fieldId);
            return {
              issue_field_id: fieldId,
              issue_field_name: definition?.name,
              data_type: definition?.data_type,
              value: definition?.data_type === 'single_select' ? null : value,
              single_select_option:
                definition?.data_type === 'single_select' ? { name: value } : null,
            };
          });
      return { ok: true, value: state.issue };
    },
    addComment(target, issueNumber, body) {
      calls.push({ operation: 'addComment', target: target.slug, issueNumber, body });
      if (options.commentFailure) return { ok: false, error: options.commentFailure };
      const comment = { id: state.comments.length + 1, body };
      state.comments.push(comment);
      return { ok: true, value: comment };
    },
    readIssue(target, issueNumber) {
      calls.push({ operation: 'readIssue', target: target.slug, issueNumber });
      if (options.issueReadFailure) return { ok: false, error: options.issueReadFailure };
      return { ok: true, value: state.issue };
    },
    readIssueFieldValues(target, issueNumber) {
      calls.push({ operation: 'readIssueFieldValues', target: target.slug, issueNumber });
      if (options.fieldReadFailure) return { ok: false, error: options.fieldReadFailure };
      return { ok: true, value: state.fields };
    },
    readComments(target, issueNumber) {
      calls.push({ operation: 'readComments', target: target.slug, issueNumber });
      if (options.commentReadFailure) return { ok: false, error: options.commentReadFailure };
      return { ok: true, value: state.comments };
    },
  };
}
