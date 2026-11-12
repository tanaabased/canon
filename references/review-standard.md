# Review Standard

Use this shared contract for Project Review, Architecture Review, Testing Review, and future review skills. Their specialist procedures determine what to investigate; this standard owns shared criteria loading, completeness, and report presentation. Authoring skills that use a named assessment section need only that section, not the full review report. Review Criteria section shape remains in [Skill Standard](./skill-standard.md#review-criteria).

## Shared Loading Rule

Reviewers use the same sequence: **observed contract → owning skill → applicable Review Criteria → required sections and references → assessment → cross-owner synthesis**.

1. Select owners from the behavior or contract under review, not its language, filename, runner, or a fixed routing registry. A mixed surface can require several owners; keep one primary owner per finding.
2. Read the owner's general Review Criteria and the specialist entry point relevant to the selected depth: Architecture for structural assessment, Testing for test assessment. Project Review uses general criteria for breadth and the relevant specialist criteria only where needed; this does not require running all three reviewers.
3. Follow applicable Required Reading triggers and the criteria's direct links through governing sections and references before judging the surface. Load only material needed for that assessment, including further required policy dependencies. A summary or resource inventory does not replace the read. Reading authoring guidance does not execute its workflow or authorize repairs, live checks, installation, or publication.
4. When an owner, section, or specialist entry point is missing or insufficient, use available authoritative guidance and source evidence for bounded findings and name the remaining coverage gap. Distinguish a genuinely inapplicable concern from unavailable criteria. Missing guidance is not itself a product defect or proof of alignment; do not silently invent policy, require every skill to gain every section, or block unrelated assessment.
5. The reviewer reconciles overlaps, missing journeys, conflicts, and cross-owner consequences, consolidating findings into one proportionate plan. Report evidence limits and unresolved applicable criteria alongside the findings; convergence applies only to the assessed scope.

## Review Completeness

- Preserve the requested scope and place the [coverage summary](#coverage-summary) before findings. A healthy sample does not establish whole-scope alignment; a scoped review does not require unrelated investigation. Keep this accounting lightweight in the review, not a permanent registry.
- Investigate consequential signals through their definitions, callers, consumers, and relevant evidence far enough to support or reject a finding. Missing evidence remains a gap. Choose the smallest worthwhile change after investigation; a small recommendation or concise output must not silently narrow the investigation.
- When multiple reviews are requested, share inventory and unchanged evidence but answer each review's distinct questions. Reconcile overlaps without substituting one investigation for the others. Report incomplete coverage explicitly rather than presenting it as convergence; no finding count or report-length target applies.
- When maintaining review instructions, exercise a broad and a smaller scoped case. Inspect actual source traces and results for coverage, consequential reasoning, scope control, and actionable recommendations or justified retention. Reuse prior evidence explicitly; distinguish manual application from fresh independent-model trials and structural validation. Do not grade against exact wording or a fixed finding list.

## Report Format

Use these sections in order for chat and requested Markdown reports: **Scope**, **Coverage**, **Findings**, **Plan**, **Limits**. Keep the summary compact without reducing the investigation or substantive recommendations. A report format does not authorize writing files, changing the reviewed project, publishing findings, or running live checks; preserve the invoking skill's permissions.

- **Scope:** Name the target, revision, relevant dirty state, requested boundary, and any requested breadth/depth targets. A subsystem or integration-only review must say so prominently. Scores refer to this declared scope; never silently narrow it after inspecting a sample.
- **Coverage:** Use the four-row summary below before findings. Report achieved inspection, not requested scores; name material shortfalls against requested targets. Without numeric targets, follow the skill's normal scope and completeness requirements rather than inventing a default score or asking for one.
- **Findings:** Present consequential findings and deliberately retained decisions with source evidence, consequences, uncertainty, and recommendations. Preserve the specialist's substance within this section: architecture explanations, responsibility maps, and diagrams; test-value and cost analysis; or project-wide synthesis. Group where useful without forcing findings into the coverage buckets or inventing findings to fill them.
- **Plan:** Sequence concrete improvements by dependencies and payoff, with validation and existing work that already owns a change. Architecture proposals and current-to-proposed maintenance walkthroughs belong here when useful. If no changes are justified, say so instead of manufacturing stages.
- **Limits:** State material unknowns, unrun checks, and what would resolve them without repeating the coverage table. Distinguish source inspection, executed tests, hosted CI, and live runtime evidence. Preserve the reviewer's completion/disposition rules; findings can be useful while requested coverage remains incomplete.

## Coverage Summary

Always use **code**, **tests**, **documentation**, and **devops**, in that order, with columns **Bucket**, **Breadth**, **Depth**, and **Notes**. Keep one row per bucket; do not rename, merge, or omit rows. Classify by responsibility rather than file extension and give a surface one primary home, cross-referencing coupled evidence without double-counting it.

| Bucket        | Includes                                                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| code          | Implementation, architecture, schemas, state ownership, runtime behavior, adapters, and integrations.                               |
| tests         | Test cases, assertions, fixtures, verification coverage, reliability, and local test selection.                                     |
| documentation | User docs, skills, agent instructions, and shared guidance; executable code and tests bundled with skills retain their own buckets. |
| devops        | CI, builds, packaging, deployment, releases, operational tooling, repository configuration, and package metadata.                   |

Use integer scores out of 10 as coarse, evidence-backed inspection estimates, not measured percentages, product-quality grades, test-coverage targets, or an aggregate score. Notes must support the estimates. Discovery, file listings, and passing tests alone do not constitute substantive review.

- **Breadth:** How much of the applicable surface within the declared scope was substantively inspected? **0** means none, **5** roughly half, **10** all of it. Estimate across meaningful responsibilities or groups, not raw file counts. A healthy sample cannot justify whole-scope coverage.
- **Depth:** How thoroughly was the inspected portion investigated against this review's applicable questions? **0** means no substantive inspection, **2** an initial read, **5** representative behavior and contracts, **8** consequential relationships and failure paths, **10** thorough examination of all applicable review questions with no material inspection gaps. Deep inspection of one subsystem can have high depth and low breadth. A 10/10 pair claims complete inspection within the declared scope, not defect-free software or proven live behavior.
- **Unexamined or excluded:** Use breadth **0/10**, depth **—**, and `Skipped: <surface and reason>`. For a genuinely inapplicable bucket, use **N/A** for both and `Not applicable: <reason>`; exclusion or missing access is not inapplicability. Missing required surfaces remain reviewable findings, not automatic N/A.
- **Notes:** Keep a single compact entry using the applicable labels `Reviewed:`, `Focused:`, `Sampled:`, and `Skipped:`. Name substantive areas and material gaps; short paths or globs are fine. A glob must not imply every matching file was read when only a sample was inspected. `Reviewed: everything` is appropriate only when supported. Use Limits for details that do not fit the row.

Users may request breadth/depth targets for the whole review or individual buckets. Preserve those targets separately from achieved scores; do not relabel incomplete work to meet a requested number. A whole-repository request accounts for every applicable bucket and explicitly reports unfinished coverage. “No findings” applies only to examined scope; a generic “not exhaustive” disclaimer does not disclose the actual boundary.

### Examples

These hypothetical summaries demonstrate presentation, not actual repository findings or scoring benchmarks. Each follows Scope and precedes Findings; the full report continues with Plan and Limits.

**Project Review — whole repository requested; assessment incomplete**

| Bucket        | Breadth | Depth | Notes                                                                           |
| ------------- | ------- | ----- | ------------------------------------------------------------------------------- |
| code          | 8/10    | 7/10  | Focused: commands and adapters; skipped: background workers.                    |
| tests         | 6/10    | 8/10  | Reviewed: parser/persistence assertions and fixtures; skipped: worker coverage. |
| documentation | 5/10    | 6/10  | Reviewed: skills and agent guidance; skipped: user guides.                      |
| devops        | 6/10    | 5/10  | Reviewed: PR checks, manifests, and builds; skipped: release/recovery tooling.  |

Hypothetical finding: Both adapters independently maintain the same persistence mapping. Consolidate that owner; finish the named gaps before claiming whole-project convergence.

**Architecture Review — workflow integration only; other subsystems excluded**

| Bucket        | Breadth | Depth | Notes                                                                                            |
| ------------- | ------- | ----- | ------------------------------------------------------------------------------------------------ |
| code          | 10/10   | 8/10  | Reviewed: integration dispatch, persistence, and recovery; traced a new field through consumers. |
| tests         | 5/10    | 5/10  | Sampled: dispatch failure assertions; skipped: other integration cases.                          |
| documentation | 5/10    | 5/10  | Reviewed: invoking skill; skipped: operator guidance.                                            |
| devops        | 0/10    | —     | Skipped: delivery tooling, outside the requested integration boundary.                           |

Hypothetical finding: Dispatch validates unrelated records before selecting its target, so one malformed record blocks independent work. Narrow validation while preserving ownership checks. No repository-wide conclusion follows.

**Testing Review — unit/component suites and supporting contracts only**

| Bucket        | Breadth | Depth | Notes                                                                                                  |
| ------------- | ------- | ----- | ------------------------------------------------------------------------------------------------------ |
| code          | 6/10    | 8/10  | Reviewed: authorization and persistence effects; skipped: parser implementation.                       |
| tests         | 6/10    | 8/10  | Reviewed: authorization/persistence groups; skipped: parser cases and out-of-scope installed journeys. |
| documentation | 10/10   | 5/10  | Reviewed: all applicable test guidance; sampled: agreement with implementation.                        |
| devops        | 0/10    | —     | Skipped: CI scheduling and release configuration, outside scope.                                       |

Hypothetical finding: Several component tests replay mocked internal calls without protecting a consequential effect. Remove that overlap while retaining authorization and persistence assertions; complete the parser review before concluding about both suites.

## Preferred Tool Assessment

Apply this section when assessing tool adoption or freshness; it does not require a broad project review or the full report format for a bounded authoring decision. Keep tool-specific compatibility and behavior checks with the owning skill.

- Inspect actual usage, declared ranges, resolved lockfile versions, runtime constraints, and action refs before deciding that a tool is absent or outdated. For relevant preferred tools, check authoritative release or registry metadata for the latest stable release and the latest stable release compatible with the project's supported runtimes, platform, and declared support contract. Honor an explicitly selected prerelease channel rather than switching channels as a freshness update. A broad range or moving major action ref alone does not prove that the project is behind; documentation on the default branch does not prove a feature has shipped.
- Recommend adoption when an applicable preferred tool is missing, or an update when a newer compatible release is available, unless a concrete compatibility, behavior, pinning, or migration-cost reason justifies retaining the current choice. Identify the benefit and smallest migration; classify a newer incompatible major as a separate migration candidate rather than silently widening the project's support contract. Do not equate passing a minimum version with being current, and do not invent a payoff merely because a version is newer.
- Report relevant tools as current, update recommended, adoption recommended, retain with reason, or unverified. Give each proposed change one owner, current and proposed usage/version evidence, and the narrowest validation that covers its behavioral risk. Leave unchanged tools as a compact group; a missing dependency alone is not a finding when the tool does not fit the surface.
- Bound upstream checks to preferred tools relevant to the selected surfaces. Reuse one lookup per upstream project and release line within the pass; record the checked date and source in the audit report, not permanent guidance. Honor offline or local-only requests and report unavailable evidence as unverified rather than current. Broader recommendation review belongs to [Skill Author — Review Preferred Tools](../skills/skill-author/SKILL.md#review-preferred-tools). Assessment never authorizes installation, lockfile changes, migration, or publication.
