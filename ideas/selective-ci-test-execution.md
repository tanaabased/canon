# Selective CI Test Execution

Explore a Tanaab tool that selects relevant test suites for a change, reducing GitHub Actions time while retaining useful regression detection. Jev from TypeSafe AI is a candidate for the judgment step. This is a proposal, not adopted CI policy or permission to skip existing checks.

## Feasibility Assessment

Research snapshot: October 28, 2026. Documentation and existing workflow structure were inspected; no model evaluation or hosted CI prototype was run.

**GitHub Actions integration is directly supported. Model accuracy is plausible for bounded suite classification but unproven for our repositories.** Start with expensive integration or Leia suites, not individual assertions or already-fast unit tests. Compare model-assisted selection with a simpler path/dependency baseline before building a shared product.

### What Jev Can Contribute

[Jev](https://docs.typesafe.ai/introduction) evaluates supplied state against typed questions and returns structured decisions. A [Choice](https://docs.typesafe.ai/primitives/choice) returns one option plus probabilities and confidence; several questions can share a request. Ask one question per suite because multiple suites can be relevant. Do not ask it to choose a single winning test suite.

A candidate question is: “Given these changed behaviors, dependencies, and this suite's coverage, how does the change relate to the suite?” Supply explicit criteria for `affected`, `unrelated`, and `insufficient_context`. Code owns the resulting run/skip policy. Jev does not inspect the repository or discover dependencies by itself; the caller must provide that evidence.

[TypeSafe's confidence value](https://docs.typesafe.ai/confidence) summarizes the answer distribution. It is not measured test-selection accuracy: a score of `0.99` does not establish a 1% missed-regression rate. Tune a skip threshold on repository-specific evidence, with stricter thresholds for consequential suites. Uncertainty means run.

The vendor's [published limitations for Jev 1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13) include indirection, distracting context, option-order sensitivity, and adversarial input. The [model catalog](https://docs.typesafe.ai/models) lists a newer release at this research date; the older limitations are evaluation cases, not proof of identical behavior in every release. No reviewed source establishes reliable test-impact analysis for our code. Pin the evaluated model in pilot configuration and reassess selection quality before changing it.

## Proposed Selection Flow

1. **Define a small suite catalog.** Give each selectable suite a stable ID, covered behavior, owned paths, shared dependencies, runner requirements, and whether it must always run. Reuse existing suite boundaries and coverage documentation.
2. **Collect the actual change.** Record base, head, and tested commit; use the full PR change rather than only its latest commit. Include renames, deletions, relevant hunks, and known dependency relationships. Missing history, incomplete diffs, or context limits cause broader testing rather than silent truncation.
3. **Apply deterministic rules first.** Always include the cheap baseline and suites affected by known dependency paths. Changes to shared build/test infrastructure, dependency resolution, selection policy, or unmapped areas default to broad coverage. Markdown is not automatically harmless: Leia examples and agent instructions can be executable product surfaces.
4. **Classify only unresolved expensive suites.** Give Jev compact, relevant evidence and a suite description. It cannot remove suites required by deterministic rules. Initially record its proposed omissions without acting on them; after evaluation, permit omissions only in the explicitly approved scope and above the measured skip threshold.
5. **Emit a validated plan.** Record suite IDs, run/skip decisions, rule IDs or model scores, model and policy versions, and commit identities. Resolve IDs through a fixed allowlist; never execute model-generated commands. Missing answers, unknown IDs, API failure, or inconsistent evidence produce a full-suite plan. If the planner itself cannot produce a valid plan, block the gate rather than pass with no tests.

For example, a change confined to backup retention could require backup suites through dependency rules while asking whether memory-retrieval scenarios are unrelated. A shared configuration-loader change would trigger broad coverage without asking the model to infer every downstream consequence. These are proposed cases, not verified safe exclusions.

## GitHub Actions Shape

GitHub supports a planning job writing outputs consumed through `needs`. Those outputs can control [job conditions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions) or a [dynamic matrix using `fromJSON`](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations#using-an-output-to-define-two-matrices). A custom action can implement the planner; downstream YAML remains repository-owned.

```text
PR event → plan suites → run selected suite jobs → verify completion gate
                         always-run baseline ──→ verify completion gate
```

The planner selects among predefined jobs or matrix entries; it does not rewrite a running workflow or choose arbitrary actions. Start inside one existing examples workflow. `needs` does not connect separate workflow runs, so keep independent lint, unit, and release gates intact rather than introducing a cross-workflow scheduler.

Use one stable required completion check for the selectively scheduled group. It runs with `if: always()` and `needs`, validates the plan for the tested revision, and requires successful results for every selected suite and baseline job. Failures, cancellations, and missing or unexpectedly skipped selected jobs must not pass. Handle an intentionally empty optional selection explicitly; it never removes the baseline. Changing required-check identities needs a coordinated repository-rules update before selective execution is enabled.

This matters because GitHub treats conditionally skipped jobs as successful, while path-filtered required workflows can remain pending. A green skipped job is not evidence that its suite passed. [GitHub's required-check guidance](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks) documents both behaviors.

Keep selection policy and credential-bearing planner code on a trusted revision; treat PR text and diffs as data. Fork PRs without model credentials should run the full suite. Do not switch to `pull_request_target` and execute PR code to obtain secrets; GitHub documents that [security boundary](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_target). Sending private source to a hosted model is a separate adoption decision. None is needed for this sketch.

## Smallest Useful Experiment

Choose one repository with measurable expensive suites; Agent System is a candidate, subject to its existing coverage policy. Canon's fast unit suite is a poor first savings target. Keep implementation local to the pilot, with a Bun-backed planner and a small TypeSafe API adapter. Consider a Tanaab Actions wrapper only after the experiment proves useful and another repository needs it.

1. **Replay historical changes.** Compare full execution, deterministic selection, and deterministic-plus-Jev selection. Include known regression-producing revisions, cross-cutting changes, and controlled seeded defects. Evaluate on changes held out from prompt and threshold tuning; an all-green history cannot establish missed-failure performance.
2. **Run in observation mode.** Publish the proposed plan as a job summary/artifact while every existing suite still runs. Measure omitted regression-catching suites, change-level missed failures, runner minutes, wall-clock delay, model latency/cost, and fallback frequency. Separate flakes and infrastructure failures from change-caused regressions. Count planner overhead and full-run audits when estimating savings.
3. **Enable a narrow opt-in only if justified.** Agree on a missed-regression tolerance and minimum net savings before enabling skips. Report sample counts and uncertainty; zero observed misses in a small sample is not a guarantee. Keep a trusted force-full override, periodic or sampled full runs, and full release validation. Merge-queue runs should initially stay full and use the required `merge_group` trigger when applicable.

Do not choose an arbitrary confidence cutoff and call it safe. If deterministic selection captures nearly all the savings, or Jev cannot meet the agreed risk budget, keep the simpler selector. If the maintenance cost exceeds the savings, retain full execution.

## Decisions Still Open

- Which workflow has enough avoidable cost to justify a pilot, based on actual timings?
- Can existing dependency and coverage metadata describe suite boundaries without becoming another stale inventory?
- What missed-regression tolerance and savings target are acceptable for the first optional suite group?
- Is hosted inference acceptable for the selected repository, and who owns model-version changes and ongoing evaluation?

Revisit after a measured pilot. This idea does not change Canon's current validation requirements or any repository's workflow configuration.
