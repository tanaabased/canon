# JavaScript Function Data Flow

Use these rules when shaping JavaScript or Bun functions in Tanaab-managed repos.

- Pair this reference with [javascript-repo-structure.md](./javascript-repo-structure.md) for file and module placement.
- Treat this file as the shared function-shape layer for JavaScript-centric skills.

## Function Shape

- Normalize raw input and options near the top of the function.
- Prefer early returns for empty, invalid, or trivial edge cases.
- Let data move forward through a small sequence of named constants.
- Default to `const` and keep mutable working variables rare.
- Clone before mutating arrays or objects that originated outside the current function.
- Keep side effects at the boundary. Read from the filesystem, environment, network, or child processes near the edge, then pass parsed data into smaller helpers.
- Prefer one main exported function per utility file.

## Imports

- Group imports in this order when they are present:
  1. Node built-ins
  2. third-party packages
  3. local or repo-provided modules
- Separate present import groups with a single blank line.
- Sort imports alphabetically within each group by imported binding name.

## Scope Notes

- These rules apply most strongly to `utils/` and other low-coupling helpers, but they are also a good default for ordinary repo-authored modules.
- Use them as a default shape, not as a reason to force unnatural refactors when existing local structure is already clearer.
