# JavaScript Function Tests

Use these defaults when validating low-coupling JavaScript helpers and utility functions.

## Direct-Test Pattern

- Prefer focused Mocha tests for pure or mostly pure ESM helpers.
- Keep the spec scoped to one helper surface and assert observable return values or narrow boundary behavior.
- For helper modules such as `utils/x.js`, prefer matching specs such as `test/x.spec.js`.
- Add `c8` only when coverage reporting or enforcement is actually part of the task.

## Starter Shapes

- `transform-unit.js` is the starter shape for pure or mostly pure transformation helpers.
- `async-boundary-unit.js` is the starter shape for helpers that read from a narrow boundary such as the filesystem and then hand parsed data to smaller helpers.
- Both starters prefer early returns, straight-line derived constants, and minimal mutation.
- When imports are needed, group them in built-in, external, and local blocks with a single blank line between blocks.
