# Inline Code and API Docs

Before deciding whether inline comments, API docs, or starter-file comments need to change, apply the [documentation change gate](./documentation-standards.md#documentation-change-gate). Use the rules below only for explanations that pass it.

## Default Rules

- Document public contracts, non-obvious invariants, side effects, error cases, and integration expectations when callers or maintainers need an explanation beyond the existing code, types, or executable contract.
- Keep API docs clear about inputs, outputs, side effects, and failure behavior when those details are not already obvious from the code.
- In reusable boilerplate or templates, allow a few terse inline comments when they explain a non-obvious contract, extension point, or shell or runtime edge case.
- Keep comments sparse; prefer a small number of high-value teaching comments over comment-heavy files.
- Do not add comments that merely restate obvious code or repeat names without adding meaning.

## JSDoc Shape

- Omit JSDoc when the public contract is already clear; use a summary-only block when a short explanation closes the gap. Exporting a helper does not itself require documentation or a full set of tags.
- Add `@param` when a parameter has non-obvious meaning, accepted vocabulary, fallback behavior, default behavior, or an object shape worth naming.
- Add `@returns` when the result's meaning or shape is not clear from the name and signature, such as a normalized value or structured report.
- Add `@throws` only for intentional contract errors that callers can reasonably handle.
- Describe side effects when callers need information beyond the function's name and signature, such as unexpected input mutation or external state changes.
- Do not require full tag coverage for tiny wrappers, obvious formatting helpers, tests, or local implementation details.
- Keep non-obvious accepted values, object shapes, return reports, and caller-handled failure modes discoverable without requiring readers to inspect the implementation.
- Do not add tags that only restate names or obvious primitive types without clarifying contract semantics.

## TypeScript Shape

- Let TypeScript signatures describe parameter and return types; do not duplicate those types in JSDoc.
- Use documentation comments when they add behavioral meaning such as accepted vocabulary, normalization, side effects, failure behavior, or non-obvious invariants.
- Keep `@throws` or prose about failures when callers need that contract, even when the rest of the signature is fully typed.

```ts
/**
 * Resolves a repository slug after validating its externally supplied owner and name.
 *
 * @throws {Error} When either slug segment is empty.
 */
export function repositorySlug(owner: string, name: string): string {
  // ...
}
```

Summary-only is enough for a tiny wrapper:

```js
/**
 * Writes one line to the target stream.
 */
export function writeLine(stream, message = '') {
  stream.write(`${message}\n`);
}
```

Use tags when the exported contract has defaults, accepted values, returned reports, or caller-facing failures:

```js
/**
 * Parses one optional boolean value from an environment-like object.
 *
 * @param {object | null | undefined} env Environment-like object to read from.
 * @param {string} key Own-property key to inspect.
 * @param {boolean} [fallback=false] Value used when the key is absent or present but blank.
 * @returns {boolean} Parsed enablement state.
 * @throws {Error} When the caller supplies an unsupported option value.
 */
export function booleanFromEnv(env, key, fallback = false) {
  // ...
}
```

## Validation

- Confirm inline comments or API docs explain contracts and non-obvious behavior rather than narrating obvious implementation.
- Confirm JSDoc tags are selective and explain useful semantics instead of repeating the JavaScript signature mechanically.
- Confirm TypeScript documentation adds behavioral meaning instead of repeating static types already present in the signature.
- Confirm boilerplate comments stay sparse and are limited to non-obvious contracts, extension points, or edge cases.
- Confirm public entrypoints or reusable helpers document surprising inputs, outputs, side effects, or failure behavior when the code alone would not make them clear.
