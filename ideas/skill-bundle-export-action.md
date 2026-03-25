# Skill Bundle Export Action

## Status

This document is exploratory. It captures a proposed GitHub Action and `canonfile` model for exporting individual skills as standalone bundles.

It is not yet a committed reference contract.

## Goal

Allow a skill author to add a small manifest such as `canonfile.toml` to a skill folder and let a reusable GitHub Action do the rest:

- vendor shared canon dependencies
- copy optional extra files such as `LICENSE`
- rewrite markdown links to bundled paths
- emit a flat `VERSION` file
- produce a distributable archive for that skill

## High-Level Model

Authoring model:

- skills are authored against the shared repo layout
- skills may reference sibling canon under `guidance/`, `ideas/`, `references/`, `prompts/`, `templates/`, and `scripts/`
- those canon buckets stay flat by default, using hyphenated scoped filenames rather than nested folder trees

Export model:

- the action reads the skill's `canonfile`
- the action copies the skill folder
- the action vendors declared shared canon into a fixed bundle layout
- the action rewrites markdown references to the vendored paths
- the action treats `bun build` import graphs as the authoritative source for bundled script runtime dependencies
- the action emits a bundle directory and archive

## Proposed Action Inputs

Required:

- `skill`
  Path to the skill folder, or a selector such as `all` or `changed`

Optional:

- `repo-root`
  Defaults to `.`
- `canonfile-name`
  Defaults to `canonfile.toml`
- `output-dir`
  Defaults to `dist/skills`
- `archive-format`
  `dir`, `tar.gz`, or `zip`
- `strict`
  Defaults to `true`
- `rewrite-markdown`
  Defaults to `true`
- `write-version`
  Defaults to manifest or action default
- `version-source`
  `git-tag`, `literal`, or `disabled`
- `version-value`
  Used when `version-source=literal`
- `emit-checksums`
  Defaults to `true`

The goal is for these inputs to stay small. Most bundle-specific behavior should come from `canonfile`.

## Proposed Bundle Layout

```text
<skill-id>/
  SKILL.md
  agents/
  assets/
  scripts/
  templates/
  vendor/
    canon/
      references/...
      guidance/...
      prompts/...
      templates/...
      scripts/...
  VERSION
  LICENSE
  bundle-manifest.json
```

Notes:

- `templates/`, `scripts/`, and `assets/` at bundle root remain skill-local content
- `vendor/canon/...` is for hoisted shared canon copied in during export
- `VERSION` is a flat file written by the action when enabled

## Proposed `canonfile` Schema

The first version should stay small and explicit.

### Example

```toml
schema = 1
id = "javascript-unit-tests"

[bundle]
vendor_root = "vendor/canon"
rewrite_markdown = true
rewrite_files = ["SKILL.md"]

[[vendor]]
from = "references/engineering-javascript.md"

[[vendor]]
from = "references/testing-unit-tests.md"

[[include]]
from = "LICENSE"
to = "LICENSE"
required = false

[version_file]
enabled = true
path = "VERSION"
source = "git-tag"
fallback = "0.0.0-dev"
strip_prefix = "v"

[[rewrite]]
file = "SKILL.md"
from = "../references/engineering-javascript.md"
to = "./vendor/canon/references/engineering-javascript.md"
```

### Proposed Fields

Top level:

- `schema`
- `id`

`[bundle]`

- `vendor_root`
- `rewrite_markdown`
- `rewrite_files`

`[[vendor]]`

- `from`
- optional `to`

`[[include]]`

- `from`
- `to`
- `required`

`[version_file]`

- `enabled`
- `path`
- `source`
- `fallback`
- `strip_prefix`

`[[rewrite]]`

- `file`
- `from`
- `to`

## Semantics

### `[[vendor]]`

Declares shared canon that should be copied into the bundle under the configured vendor root.

Allowed source roots should be limited to:

- `guidance/`
- `ideas/`
- `references/`
- `prompts/`
- `templates/`
- `scripts/`

### `[[include]]`

Declares additional files to copy as-is into the bundle.

Examples:

- `LICENSE`
- `LICENSE.md`
- `NOTICE`
- selected top-level metadata files

This is the right place for optional extra files that are not part of shared canon vendoring.

### `[version_file]`

Controls writing a flat `VERSION` file into the bundle.

Recommended defaults:

- enabled
- `path = "VERSION"`
- `source = "git-tag"`
- `fallback = "0.0.0-dev"`

The action should allow this to be overridden or disabled at workflow runtime.

### `[[rewrite]]`

Escape hatch only.

The normal case should be automatic rewrite generation based on vendored dependencies and the bundle layout. Explicit rewrite rules should be needed only when a skill has unusual path strings or non-standard markdown references.

## Proposed Action Flow

1. Resolve the target skill or set of skills.
2. Find and parse each `canonfile`.
3. Validate schema version and allowed source roots.
4. Run `bun build` for any bundleable script entrypoints and treat the import graph as the source of code/runtime dependencies.
5. Copy the skill folder into a staging bundle.
6. Vendor declared shared canon into `vendor/canon/...`.
7. Copy extra files from `[[include]]`.
8. Compute a markdown rewrite map from original shared paths to vendored bundle paths.
9. Apply automatic rewrites, then merge any explicit `[[rewrite]]` overrides.
10. Copy or emit the assets/templates brought in by bundled script imports instead of relying on repo-relative runtime access.
11. Write `VERSION` if enabled.
12. Write `bundle-manifest.json` with the bundle id, source commit, declared deps, and exported files.
13. Validate that rewritten links resolve within the bundle.
14. Emit the bundle directory and optional archive.

## Validation Goals

The exporter should fail in strict mode when:

- a declared vendored path does not exist
- a vendored path escapes the allowed shared roots
- an included required file is missing
- a bundled script build has unresolved repo-owned imports
- a rewritten markdown link does not resolve
- undeclared shared canon references remain in a standalone bundle

## Bundling Direction

- `canonfile` remains responsible for vendored shared canon, extra includes, markdown rewrites, and bundle metadata.
- `bun build` import graphs are the authoritative source for script/runtime dependencies of bundled scripts.
- Exporters should bundle or copy the assets, templates, and machine-readable canon pulled in by script imports instead of assuming repo-relative access survives export.

## Design Options

### Option 1: Export only the skill folder

Pros:

- simplest

Cons:

- incompatible with shared-canon authoring

### Option 2: Infer everything from markdown links

Pros:

- low authoring overhead

Cons:

- brittle
- hard to validate and review

### Option 3: Explicit `canonfile`

Pros:

- deterministic
- reviewable
- supports non-markdown files and `VERSION`

Cons:

- extra authoring burden

### Option 4: Hybrid inference plus manifest override

Pros:

- simpler for common cases

Cons:

- more implementation complexity
- two sources of truth unless validation is strict

## Recommendation

If this action is built, start with explicit `canonfile` manifests as the main source of truth.

The action should infer ordinary markdown rewrite targets from the fixed bundle layout, but the manifest should remain authoritative for:

- vendored canon dependencies
- included extra files
- version-file behavior
- unusual rewrite overrides

## Why This Lives In `ideas/`

This proposal depends on real skill patterns that do not yet exist in the repo.

Before freezing it into `references/`, the repo should:

1. create a few real skills that load shared canon
2. observe what those dependencies look like in practice
3. identify the minimum manifest needed to export them cleanly
4. then convert the successful model into a stable reference contract
