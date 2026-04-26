# JavaScript Repo Structure

Use this reference for Bun- or Node-based JavaScript repositories and for skill-local JavaScript helper code in Tanaab-managed repos.

- This is a JS-first default, not a cross-language law.
- It applies to code-bearing surfaces, not to the flat top-level canon buckets in this repo.
- Pair this reference with [coding-stack-preferences.md](./coding-stack-preferences.md) for runtime, framework, and tooling defaults.
- Pair it with [javascript-function-data-flow.md](./javascript-function-data-flow.md) for function shape, mutation discipline, and import grouping.
- Future live coding skills should use this reference instead of re-copying repo-structure rules into each skill.

## Scope Folders

- Organize code by purpose and owned surface rather than by implementation type.
- First decide whether the repo is a thin single-package surface or a multi-package, multi-app, or multi-scope surface.
- Use the smallest purpose-named scope folder that explains why the code exists, such as `cli/`, `config-loader/`, `release/`, `build/`, or `plugins/`.
- When a repository is effectively one surface, the repo root can act as that scope.
- In thin single-package repos, the repo root or a direct source root such as top-level `lib/` or `src/` can be treated as the source surface.
- In multi-package repos, or repos where `lib/` or `src/` contains multiple purpose folders, apps, packages, or independently owned surfaces, treat those inner folders as the owning scopes.
- Avoid broad type buckets such as `helpers/`, `classes/`, or `components/` when a purpose-named scope would be clearer.

## Preferred Layout Inside a Scope

- Use `bin/` only for real CLI entrypoints.
- Use `utils/` only for low-coupling helpers that are plausible extraction candidates.
- In thin single-package repos, top-level `utils/` is acceptable as a sibling to direct source roots such as `lib/` or `src/`.
- In multi-scope source trees, keep `utils/` inside the nearest owning scope unless the helper passes the hoisting test.
- Keep ordinary implementation modules at the scope root with short purpose-driven names.
- Add `lib/` only when the scope root becomes crowded enough that grouping improves clarity.
- Do not create empty structural folders just to satisfy the pattern.

## `bin/` Boundary

- Treat a hashbang-bearing JavaScript file as a true CLI only when it exposes normal CLI behavior such as help, usage, options, arguments, or direct user-facing command behavior.
- Put true package- or user-facing JavaScript CLIs under `bin/` and declare them in `package.json` when package metadata is in scope.
- Commit hashbang-bearing JavaScript CLI entrypoints executable.
- When a true Bun CLI is meant to ship as a built artifact, keep the entrypoint and its dependency graph friendly to `bun build`.
- Prefer static `import` statements for repo-authored and package dependencies when the built CLI artifact is the real product surface.
- If a file does not expose normal CLI behavior, omit the hashbang and treat it as an ordinary script or library module instead.
- If a JavaScript file does not have a hashbang, do not mark it executable.
- Skill-local helper scripts under `skills/**/scripts/` stay bundled with their owning skill and are exempt from the repo-level `bin/` convention.
- Even when they stay outside repo-level `bin/`, skill-local shebang-bearing scripts should still be committed executable.

## `utils/` Boundary

- Each `utils/` file should export one main function by default.
- Prefer `utils/` for helpers that are generic, portable, and low-coupling enough to survive reuse with little or no rewrite.
- A helper does not belong in `utils/` just because it is called from multiple files. Shared usage inside one scope is not enough by itself.
- Keep repo-shaped orchestration, product vocabulary, multi-step workflows, and surface-specific assumptions near the owning scope instead of moving them into `utils/`.
- Repo-coupled helpers in `utils/` are a warning to review, not an automatic failure. Keep them only when the coupling is narrow and inherent to the surface, such as GitHub Action input helpers or CLI plumbing.
- Normalize raw inputs near the top of a `utils/` function, use early returns for trivial cases, and prefer straight-line data flow with named constants.
- Keep side effects out of `utils/` unless the function explicitly owns a narrow boundary such as loading, writing, or process execution.

## Naming

- Prefer kebab-case for repo-authored JavaScript filenames unless the ecosystem requires a fixed conventional name.
- Use the shortest accurate filename that still describes the file's purpose.
- `utils/` filenames may be slightly longer when needed to keep the function name honest.

## Hoisting

- Keep code local to the owning scope by default.
- Hoist a module only when it is actually reused across 2+ sibling scopes or is clearly becoming a shared contract.
- Hoist to the nearest sensible ancestor rather than jumping automatically to repo root.
- Do not hoist a file just because it could be reused later.
- If a shared helper is still shaped by one surface's vocabulary or orchestration, keep it local until the coupling is removed.

## Exceptions

- In very small repos, a few repo-specific JavaScript files can stay at the root without inventing extra scope folders.
- Framework or ecosystem conventions may override this pattern when the conventional layout is clearer than a custom purpose tree.
- Generated output, published artifacts, or external tool contracts may require fixed filenames or directories that take precedence over this reference.
