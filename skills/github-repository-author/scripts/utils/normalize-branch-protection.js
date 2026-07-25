function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sortedStrings(values = []) {
  return [...values].map(String).sort((left, right) => left.localeCompare(right));
}

function actorNames(values = [], key) {
  const names = values
    .map((value) => (typeof value === 'string' ? value : value?.[key]))
    .filter(Boolean);
  return sortedStrings(names);
}

function enabledValue(value) {
  if (isPlainObject(value) && 'enabled' in value) {
    return Boolean(value.enabled);
  }

  return Boolean(value);
}

function normalizedCheck(value) {
  if (typeof value === 'string') {
    return { app_id: null, context: value };
  }

  return {
    app_id: value?.app_id ?? null,
    context: String(value?.context ?? ''),
  };
}

function normalizedChecks(statusChecks) {
  const values = statusChecks?.checks ?? statusChecks?.contexts ?? [];
  return values
    .map(normalizedCheck)
    .filter((value) => value.context)
    .sort((left, right) => {
      const leftKey = `${left.context}:${left.app_id ?? ''}`;
      const rightKey = `${right.context}:${right.app_id ?? ''}`;
      return leftKey.localeCompare(rightKey);
    });
}

function normalizedRestrictions(value) {
  if (!value) {
    return null;
  }

  return {
    apps: actorNames(value.apps, 'slug'),
    teams: actorNames(value.teams, 'slug'),
    users: actorNames(value.users, 'login'),
  };
}

function normalizedReviewSettings(value = {}) {
  const settings = value ?? {};
  const dismissalRestrictions = settings.dismissal_restrictions ?? {};
  const bypassAllowances = settings.bypass_pull_request_allowances ?? {};

  return {
    bypass_pull_request_allowances: {
      apps: actorNames(bypassAllowances.apps, 'slug'),
      teams: actorNames(bypassAllowances.teams, 'slug'),
      users: actorNames(bypassAllowances.users, 'login'),
    },
    dismissal_restrictions: {
      apps: actorNames(dismissalRestrictions.apps, 'slug'),
      teams: actorNames(dismissalRestrictions.teams, 'slug'),
      users: actorNames(dismissalRestrictions.users, 'login'),
    },
    dismiss_stale_reviews: Boolean(settings.dismiss_stale_reviews),
    require_code_owner_reviews: Boolean(settings.require_code_owner_reviews),
    require_last_push_approval: Boolean(settings.require_last_push_approval),
    required_approving_review_count: Number(settings.required_approving_review_count ?? 0),
  };
}

/**
 * Normalizes GitHub or policy branch protection to a URL-free, order-stable shape.
 *
 * @param {object | null} value Branch-protection response or desired payload.
 * @returns {object | null} Comparable protection state.
 */
export default function normalizeBranchProtection(value) {
  if (!value) {
    return null;
  }

  return {
    allow_deletions: enabledValue(value.allow_deletions),
    allow_force_pushes: enabledValue(value.allow_force_pushes),
    allow_fork_syncing: enabledValue(value.allow_fork_syncing),
    block_creations: enabledValue(value.block_creations),
    enforce_admins: enabledValue(value.enforce_admins),
    lock_branch: enabledValue(value.lock_branch),
    required_conversation_resolution: enabledValue(value.required_conversation_resolution),
    required_linear_history: enabledValue(value.required_linear_history),
    required_pull_request_reviews: normalizedReviewSettings(value.required_pull_request_reviews),
    required_status_checks: value.required_status_checks
      ? {
          checks: normalizedChecks(value.required_status_checks),
          strict: Boolean(value.required_status_checks.strict),
        }
      : null,
    restrictions: normalizedRestrictions(value.restrictions),
  };
}
