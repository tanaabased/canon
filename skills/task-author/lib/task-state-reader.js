/** Read the current issue plus only the optional managed surfaces needed by the caller. */
export function readTaskState(
  client,
  target,
  { comments = true, fields = true, issueNumber = target.issueNumber } = {},
) {
  const issue = client.readIssue(target, issueNumber);
  const fieldRead = fields ? client.readIssueFieldValues(target, issueNumber) : null;
  const commentRead = comments ? client.readComments(target, issueNumber) : null;
  const reads = [issue, fieldRead, commentRead].filter(Boolean);
  return {
    errors: reads.filter(({ ok }) => !ok).map(({ error }) => error),
    issue: issue.ok ? issue.value : null,
    fields: fieldRead?.ok ? fieldRead.value : [],
    comments: commentRead?.ok ? commentRead.value : [],
  };
}
