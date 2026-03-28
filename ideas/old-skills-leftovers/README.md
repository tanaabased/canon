# Old Skills Leftovers

This folder is the staging area for carryover coding material from the deleted legacy skill stack that still does not have an obvious single future skill owner or a stable enough cross-skill role to hoist into [`references/`](../../references/).

This folder is the working source of truth for unresolved residue from that retired stack.

The files below are carryover snapshots. They are not active canon, not installed skill inputs, and not approved shared references.

## Current Leftovers

| Snapshot | Source material | Why it is unresolved | Likely future destination |
| --- | --- | --- | --- |
| [`documentation-inline-code-and-api-docs.md`](./documentation-inline-code-and-api-docs.md) | Inline code and API docs policy from `old-skills/tanaab-documentation/SKILL.md` | Useful doctrine, but not enough standalone shape yet for a narrow live skill and not clearly shared enough to hoist today | Either a future hoisted coding reference or local doctrine inside future JS and VitePress skills |
| [`template-setup.md`](./template-setup.md) | `old-skills/tanaab-templates/templates/documentation/TEMPLATE-SETUP.md` | Strong template-adoption contract, but no current live skill owns repo-template adoption | Future template-adoption or repo-authoring surface |
| [`github-actions-template-index.md`](./github-actions-template-index.md) | `old-skills/tanaab-templates/templates/github-actions/README.md` | Spans multiple future skills and mostly catalogs template pairings rather than owning one doctrine surface | Revisit after `tanaab-github-action-author`, `tanaab-github-workflow-author`, and `tanaab-operational-scenario-test-author` exist |
| [`testing-template-index.md`](./testing-template-index.md) | `old-skills/tanaab-templates/templates/testing/README.md` | Cross-surface test-template catalog that is too broad to hoist and too mixed to keep local to one future skill today | Revisit after `tanaab-javascript-unit-test-author` and `tanaab-operational-scenario-test-author` exist |
| [`bun-cli-support.js`](./bun-cli-support.js) | `old-skills/tanaab-coding-core/scripts/bun-cli-support.js` | Implementation helper, not doctrine; coupled to the retired coding-core layout and only worth reviving if multiple new skills need the same helper layer | Re-author later only on proven reuse |

## Rules

- Do not promote leftovers directly into live skills without updating the audit first.
- Do not hoist leftovers just because they are old; they still need to pass the 2-skill reuse test or earn a clear single owner.
- Delete a leftover once its destination is decided and the new home exists.
