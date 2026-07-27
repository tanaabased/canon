# Optimize Canon Repo

Use this prompt to plan a staged optimization pass on this repo so canon practices what it preaches.

Operate on this repo only. Treat `skills/` as the live skill surface and treat repo-root canon, plugin, package, documentation, automation, and code surfaces as part of the live repo. Treat `guidance/` and `ideas/` as cold-path material: inventory them, but do not optimize them as live runtime canon unless current repo evidence makes them relevant.

Use current repo evidence first. Only ask the user when a decision cannot be resolved from the repo's checked-in policy, supported tooling, or live surface shape.

## Planning and Proposal Mode

- Start by producing a concrete staged optimization proposal.
- Do not mutate the repo on the first pass for this prompt.
- Read-only discovery and validation are allowed when they materially improve the proposal.
- Stop after the proposal unless the user explicitly asks for implementation in a follow-up turn.
- Recommend changes only when repo evidence supports them. An aligned surface or a no-change result is valid and should not be turned into cleanup work.

## Bootstrap and Dynamic Discovery

Start with the smallest stable bootstrap:

- Read `../AGENTS.md` as the ambient repo contract.
- Inspect `../package.json` and the plugin manifest to understand the supported package, validation, and distribution surfaces.
- If live skills exist, load the Skill Author skill and follow its link to the current skill contract.

Then discover the rest of the governing context from the repo instead of relying on a fixed filename list:

1. Inventory tracked root files and directories, live skill directories containing `SKILL.md`, package or workspace manifests, workflows, executable entrypoints, tests, templates, prompts, references, and bundled skill resources.
2. Read each live skill's frontmatter, owned-surface description, and bundled-resource links.
3. Identify code-bearing scopes from actual source files, shebangs, executable modes, package manifests, and build or test configuration. Do not assume every scope is JavaScript-only.
4. Load the applicable authoring or standardization skills for the surfaces the inventory actually finds. Follow the shared and skill-local references those skills cite rather than maintaining another master list here.
5. Inspect repo-native validation commands and CI workflows before proposing a validation plan.

Do not load every reference merely because it exists. Use `AGENTS.md`, live skill links, manifests, and the discovered surface type to route into the smallest relevant contract.

## Governing Rules

Apply these repo rules throughout the pass:

- Prefer `merge`, `move`, `extract`, or `delete` before `add`.
- Keep support material local by default.
- Hoist only on proven reuse, repo-wide contract status, or standalone human value.
- Keep top-level canon buckets flat by default.
- Keep repo-level `scripts/` code-only and suffix-encoded.
- Treat plugin, package, README, changelog, automation, and repo-root docs consistency as part of the live surface.
- Preserve the current language and framework of an owning scope unless repo evidence or the user calls for a migration.
- Do not force `utils/` extraction when code is tightly coupled.
- Do not force hoisting just because something can be shared.
- Do not rewrite for stylistic neatness alone.
- Prefer existing checks over a new custom validator. Do not encode semantic placement judgments in a brittle structural auditor.
- Preserve unrelated user changes and report any dirty-tree constraint that affects the proposal.

## Coverage Domains

Work through these domains in order. Mark a domain `aligned` or `not applicable` when the inventory supports that conclusion; expand it only when there is evidence of drift.

### 1. Inventory and Classify the Live Repo

- Establish the current root surfaces, live skill count, code-bearing scopes, package or workspace boundaries, public and internal commands, tests, generated artifacts, and supported validation commands.
- Separate live runtime or distribution surfaces from cold-path guidance, ideas, historical material, and generated cache state.
- Record any missing ownership, ambiguous source of truth, or stale link that affects later decisions.

### 2. Audit Skill Ownership and Discovery

- Account for every live skill under `../skills/`.
- Prefer one clear owned surface per skill and flag real overlap, routing behavior, or surfaces that should consolidate.
- Check discovery descriptions, frontmatter, section shape, and bundled-resource paths against the current Skill Author contract.
- For coding skills, confirm broad discovery language still funnels into one dominant implementation pattern and that testing and workflow guidance each use one canonical mechanism.
- Tighten contradictory ownership language or repeated prose only when a concrete boundary or maintenance problem exists.

Report aligned skills as a group. Give individual keep, merge, split, rename, delete, or tighten decisions only for skills with a finding.

### 3. Audit Support Ownership and Hoisting

- Review root and skill-local references, templates, assets, scripts, and test support using the repo's current hoisting rules.
- Keep material local when it serves one owning surface.
- Demote hoisted material that no longer earns root placement.
- Hoist only when current consumers prove shared ownership or the artifact is a true repo-wide contract or standalone human resource.
- Keep cold-path guidance and ideas out of live skill hot paths unless the repo demonstrates a current need.

### 4. Audit Applicable Code, Package, and Command Surfaces

- Apply the current repo-structure and function-shape guidance to each discovered code-bearing scope where it honestly applies.
- Preserve nearest-owner `bin/`, `scripts/`, `lib/`, `utils/`, and flat `test/` organization unless an established framework, package, or workspace contract justifies another layout.
- Apply JavaScript, TypeScript, Bun, shell, CLI, frontend, workspace, or other surface-specific canon only when the corresponding files or manifests exist.
- Review tests with the same ownership and hoisting rules as source.
- Review public and internal commands for help, version, option precedence, output, and build behavior using the applicable CLI contract.
- Follow a skill's linked examples or scenario framework when that skill identifies them as the supported validation path.

Record concrete structure or behavior changes only for drifted scopes. Leave honestly coupled or already aligned code alone.

### 5. Audit Root and Distribution Consistency

- Review every discovered root live surface rather than relying on a fixed root-file checklist.
- Check consistency across plugin manifests, package metadata, README and companion documentation, changelog, agent guidance, CI workflows, prompts, templates, executable entrypoints, lockfiles, and lint or format configuration when present.
- Confirm root templates and prompts still have proven shared or cross-task value.
- Check identity-bearing fields, skill IDs, names, descriptions, paths, and generated or cached manifests for stale references.
- Treat missing or additional root surfaces according to their actual ownership and distribution role rather than assuming they should exist.

### 6. Build the Staged Proposal and Validation Plan

- Rank findings by leverage, correctness risk, and dependency order.
- Separate policy or documentation changes, structural moves, behavioral code changes, generated artifacts, and cache synchronization when separate commits would improve reviewability.
- Derive validation from `../AGENTS.md`, available package scripts, and touched-surface contracts. Prefer supported repo commands over invoking internal validator files directly.
- Include targeted tests, builds, smoke checks, stale-reference searches, formatting checks, and diff checks only where the proposed changes justify them.
- If managed plugin or cache surfaces would change, include the repo's supported cache check and synchronization flow and note any required agent restart.
- Do not propose a new validator unless the rule is deterministic, important, and not already covered by an existing supported check.

## Required Specificity

The final proposal must be decision-complete and grounded in current paths and evidence. Include:

- a concise inventory summary and the surfaces considered live, cold-path, generated, or not applicable
- grouped confirmation of aligned skills and detailed decisions for every skill with a finding
- the exact contradiction, overlap, stale reference, ownership problem, or structural drift behind each recommended change
- specific support files to keep local, keep hoisted, demote, promote, or defer when findings exist
- specific code-bearing or package scopes to change, along with the intended ownership structure
- specific root or distribution inconsistencies to correct
- an implementation sequence ordered by leverage and dependencies
- the exact repo-native validation appropriate to the proposed changes
- unresolved decisions that genuinely require user input

Do not return a generic audit checklist or merely restate the coverage domains. Do not invent changes to satisfy the output shape.

## Final Output Shape

End with one concrete optimization proposal grouped by:

- current-state summary
- aligned or not-applicable surfaces
- recommended changes, ordered by leverage and risk
- deferred or user-decided questions
- implementation and commit sequence
- validation and cache or restart notes

If the client supports `<proposed_plan>`, wrap the final proposal in that block. Otherwise return the same content as plain Markdown.

## Success Criteria

The planning pass is complete when:

- every live skill and discovered live root surface has been accounted for
- recommendations are supported by current repo evidence rather than a fixed historical inventory
- skill ownership and discovery boundaries have no unresolved contradictions
- local versus hoisted material matches the repo's current ownership rules
- applicable code, package, test, CLI, and frontend surfaces follow their current canon where it honestly applies
- root plugin, package, automation, and documentation surfaces are internally consistent
- aligned and not-applicable domains are reported without manufacturing work
- the proposal defines proportional validation and stale-reference cleanup for every changed live surface
