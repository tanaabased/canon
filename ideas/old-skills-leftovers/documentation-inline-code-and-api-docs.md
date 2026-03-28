# Inline Code And API Docs Policy

Source: `old-skills/tanaab-documentation/SKILL.md`
Status: carryover snapshot; not active canon

## Policy

- Document public contracts, non-obvious invariants, side effects, error cases, and important integration expectations.
- Do not add comments that merely restate obvious code or repeat names without adding meaning.
- In reusable boilerplate or templates, allow a few terse inline comments when they explain a non-obvious template contract, extension point, or shell or runtime edge case.
- Keep boilerplate comments sparse; prefer a small number of high-value teaching comments over comment-heavy starter files.
- Keep API docs clear about inputs, outputs, side effects, and failure behavior.

## Validation Cues

- Confirm inline code or API docs explain contracts and non-obvious behavior rather than narrating obvious implementation.
- Confirm boilerplate comments stay sparse and are limited to non-obvious contracts, extension points, or edge cases.
