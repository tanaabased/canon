# Refresh Preferred Tools

Use `$tanaab-skill-author` to review tool recommendations in the selected Canon skills against their authoritative upstream releases. Keep this pass read-only and stop after a concise proposal.

1. Read the repository guidance and [Preferred Tools contract](../references/skill-standard.md#preferred-tools). Use the skills or upstream repositories named in the request. If neither is supplied, ask for a bounded scope; do not scan an organization or every installed skill.
2. Start from the selected skills' existing tool links and any explicitly supplied new sources. Inspect official releases, maintained documentation, and relevant package or action contracts. Record the reviewed release or commit in the audit report; proposed guidance should link maintained docs and state only necessary compatibility minimums or ranges. Defer unreleased or inaccessible candidates and distinguish verified compatibility from uncertainty.
3. Assign each useful candidate to the narrowest existing skill owner. Apply the [shared adoption and freshness assessment](../references/skill-standard.md#preferred-tools), comparing installed/resolved versions with current stable releases, applicability, runtime and platform limits, behavior, migration effort, and maintenance benefit. Retain existing choices when replacement has no material payoff; report an ownership gap without inventing a new skill.
4. Compare the recommendation with its point-of-use instructions, Optimization facet, and linked templates or shared references. Propose one coherent correction per finding, removing stale or duplicated guidance instead of appending another competing rule. Keep API and input details upstream.
5. Return only justified changes and material deferrals, with the owning skill, affected paths, reviewed upstream evidence, and proportional validation. If nothing warrants an update, say so and stop.

This prompt proposes Canon guidance changes. It does not install tools, migrate consuming projects, edit files, create issues, publish changes, or schedule future runs. A later implementation request authorizes the selected follow-up work.
