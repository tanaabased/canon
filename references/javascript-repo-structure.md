# JavaScript Repo Structure

Use this reference for Bun- or Node-based JavaScript repositories and for skill-local JavaScript code in Tanaab-managed repos.

- This is a JS-first default, not a cross-language law.
- It applies to code-bearing surfaces, not to the flat top-level canon buckets in this repo.
- Pair this reference with [coding-stack-preferences.md](./coding-stack-preferences.md) for runtime, framework, and tooling defaults.
- Pair it with [javascript-function-data-flow.md](./javascript-function-data-flow.md) for function shape, mutation discipline, and import grouping.
- Future live coding skills should use this reference instead of re-copying repo-structure rules into each skill.

## Owning Scope

- Organize code by owned purpose first, then by runtime role inside that owning scope.
- Choose the nearest directory that completely owns the surface. Climb only far enough to reach a coherent shared owner, then stop.
- A thin single-surface repository may use the repository root as its owning scope.
- A skill, package, app, plugin, or independent product surface should normally own its code beneath its own directory.
- Code shared by multiple sibling scopes may move to their nearest common owner only after it passes the hoisting test.
- Do not hide structured code beneath an extra generic directory when the owner is already clear.

## Standard Layout Inside a Scope

Use the applicable role folders directly beneath the owning scope:

```text
scope/
├── bin/       # public, human-facing command entrypoints
├── lib/       # surface-specific libraries and orchestration
├── scripts/   # internal machine-, agent-, or maintainer-facing commands
├── utils/     # independently testable function-shaped units
└── test/      # tests owned by this scope
```

- Create only the role folders the scope actually needs.
- Keep executable entrypoints thin and move reusable behavior into `lib/` or `utils/`.
- Do not keep ordinary implementation modules loose at the scope root when one of these roles describes them.
- Purpose-named subscopes may repeat this layout when one owner contains multiple independently understandable surfaces.

## `bin/` Boundary

- Use `bin/` for commands intended as a public or directly human-facing interface.
- Treat command names, help, arguments, options, output, and exit behavior as a stable user contract.
- Declare package-level CLIs in `package.json` when package metadata is in scope.
- Keep public entrypoints friendly to `bun build` when built artifacts are part of the product surface.
- Prefer static imports for repo-authored and package dependencies when the built CLI artifact is the product.
- Commit directly executable JavaScript entrypoints with a shebang and executable mode.
- If a command is intended only for a skill, agent, machine workflow, or repository maintainer, place it in `scripts/` instead.

## `scripts/` Boundary

- Use `scripts/` for internal command entrypoints used by skills, agents, automation, builds, validation, or maintainers.
- Internal scripts may expose CLI-like arguments, help, output, and exit codes, but they are not a supported public interface.
- Keep scripts thin over `lib/` and `utils/`; do not use `scripts/` as a blanket container for libraries or testable units.
- Use role-encoded suffixes for repo-root scripts: `-cli.js` for human-invoked internal commands and `-task.js` for automation entrypoints. Move import-only modules to `lib/`.
- Commit directly executable scripts with a shebang and executable mode. Do not mark non-shebang JavaScript executable.

## `lib/` Boundary

- Use `lib/` for surface-specific libraries, stateful clients, orchestration, and domain-shaped implementation modules.
- Library modules may own product vocabulary, multi-step workflows, state, and boundary coordination that would make a utility misleading.
- Keep public or internal command entrypoints out of `lib/`; commands should import the library instead.
- Prefer short purpose-driven filenames and avoid broad type buckets such as `helpers/` or `classes/`.

## `utils/` Boundary

- Use `utils/` for independently testable, function-shaped units with narrow inputs, outputs, and side effects.
- Each utility file should export one main function by default and have a focused matching spec when behavior is non-trivial.
- Utilities should be lower-coupling than their callers, but they may retain vocabulary from their owning scope; cross-scope portability is not required.
- Extract logic into a utility when it can be tested honestly without constructing the larger library or command surface.
- Keep stateful orchestration and multi-step product workflows in `lib/` even when private helper functions remain there.
- Normalize raw inputs near the top, use early returns for trivial cases, and prefer straight-line data flow with named constants.
- Keep side effects out unless the utility explicitly owns one narrow boundary such as loading, writing, or process execution.

## `test/` Boundary

- Keep tests inside the same owning scope as the code they validate by default.
- Keep the scope's `test/` directory flat by default; do not mirror `bin/`, `lib/`, `scripts/`, `utils/`, `support/`, or `unit/` beneath it.
- Put specs, fixtures, fakes, and test-support JavaScript directly beneath the scoped `test/` directory and use descriptive filenames to communicate ownership.
- Hoist tests only when the tested implementation is itself owned at that higher scope or the test intentionally spans multiple sibling scopes.
- Do not treat a repository-root `test/` directory as a special collection point for tests owned by nested skills, packages, apps, or plugins.
- Move tests with their source whenever ownership changes.

## Naming

- Prefer kebab-case for repo-authored JavaScript filenames unless an ecosystem requires a fixed name.
- Use the shortest accurate filename that still describes the file's purpose.
- Utility filenames may be slightly longer when needed to keep the exported function name honest.

## Hoisting

- Apply the same hoisting test to `bin/`, `lib/`, `scripts/`, `utils/`, and `test/`.
- Keep files local to the owning scope by default.
- Hoist only when a file is used across two or more sibling scopes, defines a true shared contract, or intentionally validates a cross-scope integration.
- Hoist to the nearest sensible common owner rather than automatically to the repository root.
- Do not hoist a file merely because it could be reused later or because its file type historically lived at the root.

## Exceptions

- Framework, generated-output, published-artifact, and external-tool contracts may require fixed filenames or directories that take precedence over this reference.
- Code embedded in `templates/` remains owned by the template artifact and should model the target layout rather than being moved into the live scope's role folders.
