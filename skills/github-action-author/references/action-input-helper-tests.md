# Action Input Helper Tests

Use this starter pattern when a GitHub Action authored in JavaScript or TypeScript has a dedicated input-normalization helper such as `utils/get-inputs.js` or `utils/get-inputs.ts`.

## What This Pattern Covers

- Preserves the original `@actions/core` getter methods before each test mutates them.
- Replaces `getInput`, `getBooleanInput`, and `getMultilineInput` with map-backed test doubles.
- Preserves and restores `process.env.GITHUB_ACTIONS` plus any fallback env vars the helper reads.
- Verifies both local-default behavior and explicit GitHub Actions runtime behavior.

## What It Does Not Cover

- End-to-end action execution through `uses: ./`
- Runner-specific shell or filesystem behavior
- Permission, checkout, or sync behavior

Use workflow smoke tests for those broader surfaces.

## Starter File

- [`../templates/get-inputs.spec.js`](../templates/get-inputs.spec.js): Mocha starter for a focused input-helper spec

Rename the example input keys, helper path, and expected result fields to match the action you are testing. Preserve the observable test contract when adapting the JavaScript starter to TypeScript.
