const STATUS_RANK = Object.freeze({
  aligned: 0,
  not_applicable: 0,
  manual: 0,
  missing: 1,
  drifted: 2,
  migration_required: 3,
  unresolved: 4,
});

/** Return the highest-risk stable schema status from one or more surface statuses. */
export function highestSchemaStatus(statuses) {
  return statuses.reduce(
    (highest, status) =>
      (STATUS_RANK[status] ?? STATUS_RANK.unresolved) > STATUS_RANK[highest] ? status : highest,
    'aligned',
  );
}

export function summarizeSchemaStatuses(statuses) {
  return statuses.reduce(
    (summary, status) => ({ ...summary, [status]: (summary[status] ?? 0) + 1 }),
    {},
  );
}
