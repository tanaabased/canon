# Inline Code and API Docs

Use this reference when inline comments, API docs, or starter-file comments are in scope for a code-bearing surface.

## Default Rules

- Document public contracts, non-obvious invariants, side effects, error cases, and important integration expectations.
- Keep API docs clear about inputs, outputs, side effects, and failure behavior when those details are not already obvious from the code.
- In reusable boilerplate or templates, allow a few terse inline comments when they explain a non-obvious contract, extension point, or shell or runtime edge case.
- Keep comments sparse; prefer a small number of high-value teaching comments over comment-heavy files.
- Do not add comments that merely restate obvious code or repeat names without adding meaning.

## Validation

- Confirm inline comments or API docs explain contracts and non-obvious behavior rather than narrating obvious implementation.
- Confirm boilerplate comments stay sparse and are limited to non-obvious contracts, extension points, or edge cases.
- Confirm public entrypoints or reusable helpers document surprising inputs, outputs, side effects, or failure behavior when the code alone would not make them clear.
