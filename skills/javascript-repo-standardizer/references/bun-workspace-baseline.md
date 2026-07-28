# Bun Workspace Baseline

Use this reference when a JavaScript or TypeScript repository contains multiple Bun workspace packages that are developed together and may be published independently.

## Workspace Shape

```text
repo/
├── package.json
├── bun.lock
├── packages/
│   ├── aggregate/
│   │   ├── package.json
│   │   ├── index.ts
│   │   └── test/
│   └── one-utility/
│       ├── package.json
│       ├── index.ts
│       ├── utils/
│       └── test/
└── test/
```

- Treat `packages/` as a grouping boundary whose children are owning scopes, not as a new runtime role.
- Mark the root package `private: true` and declare the workspace packages with `workspaces: ["packages/*"]`.
- Keep one root `.bun-version`, `packageManager`, and committed `bun.lock`.
- Keep repo-wide development tooling at the root. Put runtime dependencies and package-specific scripts in the workspace that consumes them.
- Keep root `test/` for deliberate cross-package coverage. Keep ordinary package tests flat inside the package that owns them.
- Apply the normal `bin/`, `scripts/`, `lib/`, `utils/`, and `test/` roles within each package only as needed.
- Allow a package-root `index.js` or `index.ts` as a thin public entrypoint because npm package entrypoints are an external contract.

Minimal root package shape:

```json
{
  "name": "@tanaab/project-workspace",
  "private": true,
  "packageManager": "bun@<pinned-version>",
  "workspaces": ["packages/*"]
}
```

## Package Boundaries

- Give every publishable workspace its own `package.json`, package name, version, ESM type, public `exports`, `files` allowlist, repository metadata, and `publishConfig.access`.
- Use `@tanaab` for Tanaab-owned root and workspace package names and internal package references while preserving third-party package scopes.
- Point `exports` and `files` at the package's real publish artifacts. Do not assume the development `noEmit` TypeScript config defines those artifacts.
- Import sibling workspaces through their declared package names and public exports. Do not reach across package boundaries with paths such as `../another-package/utils/x.ts`.
- Declare sibling workspace dependencies with a workspace range such as `workspace:^`; Bun resolves the local package during development and replaces the workspace protocol when packing or publishing.
- Keep types with their owning package and export them through the same intentional public boundary as runtime values.
- Avoid circular workspace dependencies. An aggregate package may depend on leaf packages, but leaf packages should not depend on the aggregate.

## Aggregate and Leaf Packages

- Keep the aggregate package as another publishable workspace instead of making the monorepo root publishable.
- For a Tanaab utilities repo, let `packages/utils/` own the aggregate `@tanaab/utils` package while each utility remains a separate sibling workspace.
- Keep each utility's implementation in its leaf package so that package remains independently installable and testable.
- Have the aggregate package depend on leaf packages through declared workspace dependencies and re-export their public APIs.
- Do not duplicate leaf implementations inside the aggregate package or import their private source paths.
- Add aggregate subpath exports only when they provide a deliberate supported API rather than exposing the workspace layout accidentally.

## Repository Commands

- Keep package scripts runnable from their own workspace.
- Use Bun workspace execution from the root for repo-wide commands, and use `--if-present` when not every package owns the same script.
- Use `--filter` for one package or a package subset. Bun respects declared workspace dependency order when running matching scripts.

```bash
bun run --workspaces --if-present lint
bun run --workspaces --if-present typecheck
bun run --workspaces --if-present test
bun run --filter '@tanaab/one-utility' test
```

- Keep the root's own lint and format checks explicit; workspace execution should not hide validation owned by the coordinator package.
- Introduce Bun catalogs only after repeated dependency-version duplication makes them simpler than ordinary manifest entries.
- Do not add Turborepo, Changesets, or another task layer until Bun workspaces and filtered scripts prove insufficient.

## Pack and Publish Boundary

- Inspect each publishable workspace independently with `bun pm pack` or `bun publish --dry-run` from that package's directory.
- Verify the tarball contains only intended runtime files, declarations, README, license, and package metadata.
- Do not imply that a successful type-check or Bun build proves the npm package contents.
- Do not publish packages as part of repo standardization.
- Require an explicit fixed-version or independent-version strategy before authoring multi-package release automation.
- Keep publish-all orchestration, declaration generation, and build-output design with the first repository that proves those contracts.
