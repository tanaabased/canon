# Inline Code and API Docs

Use this reference when inline comments, API docs, or starter-file comments are in scope for a code-bearing surface.

## Default Rules

- Document public contracts, non-obvious invariants, side effects, error cases, and important integration expectations.
- Keep API docs clear about inputs, outputs, side effects, and failure behavior when those details are not already obvious from the code.
- In reusable boilerplate or templates, allow a few terse inline comments when they explain a non-obvious contract, extension point, or shell or runtime edge case.
- Keep comments sparse; prefer a small number of high-value teaching comments over comment-heavy files.
- Do not add comments that merely restate obvious code or repeat names without adding meaning.

## JSDoc Shape

- Use a summary-only block only when the signature already makes inputs and return value obvious, the helper has no meaningful defaults or accepted vocabulary, and it has no intentional throws or side effects.
- For exported helpers, default to documenting meaningful parameters, non-void return values, and intentional caller-facing errors with `@param`, `@returns`, and `@throws`.
- Add `@param` when a parameter has non-obvious meaning, accepted vocabulary, fallback behavior, default behavior, or an object shape worth naming.
- Add `@returns` when the output is a normalized value, status boolean, report object, diff object, or another shape that is not obvious from the function name.
- Add `@throws` only for intentional contract errors that callers can reasonably handle.
- Describe side effects in prose when a function reads or writes files, mutates inputs, shells out, writes to streams, changes process state, or syncs external cache state.
- Do not require full tag coverage for tiny wrappers, obvious formatting helpers, tests, or local implementation details.
- Treat omitted tags on exported helpers as an explicit choice. The doc should still make the public contract clear without forcing readers to infer accepted values, object shapes, return reports, or failure modes from implementation.
- Do not add tags that only restate names or obvious primitive types without clarifying contract semantics.

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
- Confirm exported helper docs use `@param`, `@returns`, and `@throws` by default when those tags clarify the public contract.
- Confirm omitted JSDoc tags are justified by genuinely obvious signatures or prose that already explains the contract.
- Confirm JSDoc tags are selective and explain useful semantics instead of repeating the JavaScript signature mechanically.
- Confirm boilerplate comments stay sparse and are limited to non-obvious contracts, extension points, or edge cases.
- Confirm public entrypoints or reusable helpers document surprising inputs, outputs, side effects, or failure behavior when the code alone would not make them clear.
