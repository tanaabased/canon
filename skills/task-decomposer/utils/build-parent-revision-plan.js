import { normalizeTaskKind } from '../../task-author/utils/normalize-task-kind.js';
import { parseFallbackMetadata } from '../../task-author/utils/parse-fallback-metadata.js';
import { renderFallbackMetadata } from '../../task-author/utils/render-fallback-metadata.js';
import { renderTaskBody } from '../../task-author/utils/render-task-body.js';
import extractTaskConstraints from './extract-task-constraints.js';
import { renderParentRollup, resolveParentRollup } from './render-parent-rollup.js';

function appendBlock(body, block) {
  if (!block) return body;
  return `${body.trimEnd()}\n\n${block.trimStart()}`;
}

/** Build the exact semantic and storage plan for converting the parent into a rollup. */
export default function buildParentRevisionPlan(evidence, proposal, children) {
  const errors = [];
  const revision = proposal.parentRevision ?? {};
  const currentKind = normalizeTaskKind(
    evidence.issue.type ?? evidence.metadata.fallback.type ?? revision.kind,
  );
  const desiredKind = normalizeTaskKind(revision.kind ?? currentKind);
  if (!currentKind) errors.push('The parent task kind is unavailable.');
  if (currentKind && desiredKind !== currentKind) {
    errors.push('Task decomposition cannot change the parent task kind.');
  }

  const rendered = desiredKind
    ? renderTaskBody(desiredKind, revision.sections)
    : { body: '', missing: ['kind'] };
  if (rendered.missing.length > 0) {
    errors.push(`Parent rollup is missing canonical sections: ${rendered.missing.join(', ')}.`);
  }
  const renderedConstraints = extractTaskConstraints(rendered.body);
  const missingConstraints = (proposal.sharedConstraints ?? []).filter(
    (constraint) =>
      !renderedConstraints.some((section) => section.includes(String(constraint).trim())),
  );
  if (missingConstraints.length > 0) {
    errors.push('Parent rollup does not render every shared constraint.');
  }
  const parsedFallback = parseFallbackMetadata(evidence.issue.body);
  errors.push(...parsedFallback.errors.map((error) => `Parent fallback metadata: ${error}`));

  const rollupBody = renderParentRollup(rendered.body, children);
  const bodyTemplate = appendBlock(rollupBody, renderFallbackMetadata(parsedFallback.fallback));
  const title = String(revision.title ?? evidence.issue.title).trim();
  if (!title) errors.push('Parent rollup title cannot be empty.');
  const revisionSummary = String(revision.revisionSummary ?? '').trim();
  if (!revisionSummary) errors.push('Parent rollup revision requires a public revision summary.');
  const comment = revisionSummary
    ? { kind: 'decomposition-summary', body: `Task decomposition summary\n\n${revisionSummary}\n` }
    : null;
  const existingComment = comment
    ? evidence.comments.some(({ body }) => body === comment.body)
    : false;

  const knownReferences = Object.fromEntries(
    children.filter(({ issue }) => issue).map(({ key, issue }) => [key, issue]),
  );
  const allReferencesKnown = Object.keys(knownReferences).length === children.length;
  const resolvedBody = allReferencesKnown
    ? resolveParentRollup(bodyTemplate, knownReferences)
    : null;
  const expectedBody = resolvedBody ?? bodyTemplate;
  const mutationTemplate = {};
  if (title !== evidence.issue.title) mutationTemplate.title = title;
  if (expectedBody !== evidence.issue.body || !allReferencesKnown)
    mutationTemplate.body = bodyTemplate;

  return {
    errors,
    plan: {
      target: `${evidence.target.slug}#${evidence.target.issueNumber}`,
      semanticDiff: {
        before: {
          title: evidence.issue.title,
          acceptanceCriteria: evidence.acceptanceCriteria,
          childRollup: evidence.subIssues.map(({ number, title: childTitle }) => ({
            number,
            title: childTitle,
          })),
        },
        after: {
          title,
          acceptanceCriteria: revision.sections?.acceptanceCriteria ?? [],
          childRollup: children.map(({ key, task }) => ({ key, title: task.title })),
        },
      },
      storageDiff: {
        title: { before: evidence.issue.title, after: title },
        body: { before: evidence.issue.body, afterTemplate: bodyTemplate },
        preserved: ['issue type', 'issue fields', 'labels', 'assignees', 'milestone', 'state'],
      },
      expected: { title, bodyTemplate },
      mutationTemplate,
      comment: existingComment ? null : comment,
    },
  };
}
